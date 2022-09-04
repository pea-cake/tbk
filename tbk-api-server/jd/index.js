const { create } = require('./mian');
const moment = require('moment');
const db_action = require('../../wechat/db_action')
const { setSchedule } = require('../../schedule')
const config = require('../../config')
const { delay } = require('../../utils')
const appKey = config.JDconfig.appKey //京东联盟分配给你的app_key
const appSecret = config.JDconfig.appSecret //京东联盟分配给你的app_secret

const api = create(
  {
    appKey: appKey,
    appSecret: appSecret,
    serverUrl: 'https://api.jd.com/routerjson'
  }
);

const getSkuId = (url) => {
  let res = url.match(/product\/(\S*)\./)
  if (res && res.length > 1) {
    return res[1]
  } else {
    return ''
  }
}



const getGoodsDetail = async (skuId) => {
  return api.request(
    'jd.union.open.goods.promotiongoodsinfo.query',
    {
      skuIds: skuId
    }
  ).then(res => {
    let result = JSON.parse(res.jd_union_open_goods_promotiongoodsinfo_query_responce.queryResult)
    if (result.data && Array.isArray(result.data)) {
      return result.data[0]
    } else {
      return null
    }
  })
}

const getLink = async (url) => {
  return api.request(
    'jd.union.open.promotion.common.get',
    {
      promotionCodeReq: {
        materialId: url,
        siteId: '4100464321',
      }
    },
  ).then(res => {
    let result = JSON.parse(res.jd_union_open_promotion_common_get_responce.getResult)
    console.log('jd_result', result)
    if (result.data) {
      return result.data
    } else {
      return null
    }
  })
}

const getOrderList = async (query = {}) => {
  return api.request(
    'jd.union.open.order.row.query',
    {
      orderReq: {
        pageIndex: 1,
        pageSize: 500,
        type: 3,
        startTime: query.startTime || moment().subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss'),
        endTime: query.endTime || moment().subtract(5, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
      }
    }
  ).then(res => {
    // console.log(res)
    let result = JSON.parse(res.jd_union_open_order_row_query_responce.queryResult)
    console.log(result)
    if (result.data) {
      return result.data
    } else {
      return null
    }
  })
}

const updateOrderDB = async function (orderList) {
  if (orderList && Array.isArray(orderList) && orderList.length > 0) {
    const db_obj = await db_action.connectMongo('taobaoke')
    for (let item of orderList) {
      let orders = await db_action.selectOrders(db_obj, { order_id: item.orderId })
      if (orders.length > 0) {
        await db_action.updateOrder(db_obj, { order_id: item.orderId }, {
          order_id: item.orderId,
          last_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          platform: 'jd',
          parentId: item.parentId,
          order_detail: item,
          real: 1,
          goods_name: item.skuName,
          goods_num: item.skuNum,
          orderTime: item.orderTime,
          finishTime: item.finishTime,
          modifyTime: item.modifyTime,
          subsidyFee: item.actualFee * config.RAKE,
          estimateCosPrice: item.estimateCosPrice, //预估计佣金额
          estimateFee: item.estimateFee, //预估全部佣金金额
          estimateCustomerFee: item.estimateFee * config.RAKE, //预估客户获得佣金金额
        })
      } else {
        await db_action.insertOrder(db_obj, {
          order_id: item.orderId,
          create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
          platform: 'jd',
          parentId: item.parentId,
          order_detail: item,
          real: 1,
          goods_name: item.skuName,
          goods_num: item.skuNum,
          orderTime: item.orderTime,
          finishTime: item.finishTime,
          modifyTime: item.modifyTime,
          actualFee: item.actualFee,
          subsidyFee: item.actualFee * config.RAKE,
          estimateCosPrice: item.estimateCosPrice, //预估计佣金额
          estimateFee: item.estimateFee, //预估全部佣金金额
          estimateCustomerFee: item.estimateFee * config.RAKE, //预估客户获得佣金金额

        })
      }
    }
    db_obj.conn.close()
  }
}
const updateOrders = async () => {
  console.log('更新订单中...')
  let orderList = await getOrderList()
  await updateOrderDB(orderList)
  console.log('更新订单完毕...')
}
const updateOrdersEveryMinute = () => {
  setSchedule('0 * * * * *', updateOrders)
}
async function updateOrderByDay(day = 1) {
  let result = []
  for (let i = 24 * day; i > 0; i--) {
    let startTime = moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm:ss')
    let endTime = moment().subtract(i - 1, 'hours').format('YYYY-MM-DD HH:mm:ss')
    let res = await getOrderList({ startTime: startTime, endTime: endTime })
    await delay(500)
    console.log(startTime, endTime, res)
    if (res) {
      result = result.concat(res)
    }
  }
  await updateOrderDB(result)
}
const getPromotionReply = async (url) => {
  let skuId = getSkuId(url)
  let result = ''
  let resultData = {
    platform: '京东'
  }
  let goods_detail = null
  if (skuId) {
    goods_detail = await getGoodsDetail(skuId);
  } else {
    return '🙁🙁🙁该宝贝无优惠，试试其他宝贝'
  }
  if (!goods_detail) {
    return '🙁🙁🙁该宝贝无优惠，试试其他宝贝'
  }
  resultData.goods_name = goods_detail.goodsName || ''
  let linkInfo = await getLink(url)
  let price = goods_detail.unitPrice || 0
  if (goods_detail.wlUnitPrice) {
    price = goods_detail.wlUnitPrice
  }
  let rate = goods_detail.commisionRatioPc || 1
  if (goods_detail.commisionRatioWl) {
    rate = goods_detail.commisionRatioWl
  }
  let money = Number(price * rate / 100 * config.RAKE).toFixed(2)
  if (money > 0) {
    resultData.money = money
    result += '福利购 🧧🧧🧧 该商品有补贴' + money + '元 🧧🧧🧧'
  }
  console.log('linkInfo', linkInfo)
  if (linkInfo.jCommand) {
    resultData.url = linkInfo.jCommand
    result += linkInfo.jCommand + '复制本条消息下单'
  } else {
    resultData.url = linkInfo.clickURL
    result += '  下单点击：' + linkInfo.clickURL
  }
  result += "下单成功不要忘记发送订单号给我，领取补贴奖励哦"
  return resultData
}

module.exports = {
  getPromotionReply,
  getOrderList,
  updateOrders,
  updateOrdersEveryMinute,
  updateOrderByDay
}
// getPromotionReply('https://item.m.jd.com/product/4718621.html?&utm_source=iosapp&utm_medium=appshare&utm_campaign=t_335139774&utm_term=CopyURL&ad_od=share&gx=RnFmlWdYb2GKmdRP--tzDnAdULrU3SjFqz2Z')