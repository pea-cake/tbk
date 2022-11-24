const PddSdk = require('pdd-sdk').default;
const moment = require('moment');
const db_action = require('../../wechat/db_action');
const config = require('../../config');
// const { setSchedule } = require('../schedule')

// 以调用商品标准类目接口为例
// 商品标准类目接口文档(https://open.pinduoduo.com/application/document/api?id=pdd.goods.cats.get)
const apiClient = new PddSdk({
    clientId: config.PDDconfig.clientId,
    clientSecret: config.PDDconfig.clientSecret,
});

/**
 * 从链接里提取参数值
 * @param {String} url
 * @param {String} key
 * @returns {String}
 */
const getUrlParamValByKey = (url, key) => {
    let clone_url = url;
    if (!clone_url) {
        return null;
    }
    clone_url = clone_url.replace(/&amp;/g, "&");
    const str = clone_url.split('?')[1];
    const arr = str.split('&');
    let res = '';
    arr.forEach((element) => {
        const k = element.split('=')[0];
        const v = element.split('=')[1];
        if (key === k) {
            res = v;
        }
    });
    return res;
};

/**
 * 搜索商品 通过关键词
 * @param {*} keyword
 * @returns
 */
const searchGoods = function (keyword) {
    return apiClient.execute('pdd.ddk.goods.search', { pid: config.PDDconfig.pid, keyword, page_size: 100 }).then((res) => {
        let goods_list = [];
        if (res.goods_search_response && res.goods_search_response.goods_list) {
            goods_list = res.goods_search_response.goods_list;
        }
        return goods_list;
    }).catch((error) => {
        console.log(error);
    });
};

/**
 * 多多进宝推广链接生成,通过goods_sign
 * @param {*} goods_sign
 * @returns
 */
const generateUrl = function (goods_sign) {
    return apiClient.execute('pdd.ddk.goods.promotion.url.generate', { p_id: config.PDDconfig.pid, goods_sign_list: [goods_sign] }).then((res) => {
        let goods_list = [];
        // eslint-disable-next-line max-len
        if (res.goods_promotion_url_generate_response && res.goods_promotion_url_generate_response.goods_promotion_url_list) {
            goods_list = res.goods_promotion_url_generate_response.goods_promotion_url_list;
        }
        if (goods_list.length > 0) {
            return goods_list[0].short_url;
        }
        return null;
    }).catch((error) => {
        console.log(error);
    });
};

// 转链
const getLink = function (source_url) {
    return apiClient.execute('pdd.ddk.goods.zs.unit.url.gen', { pid: config.PDDconfig.pid, source_url }).then((res) => res.goods_zs_unit_generate_response).catch((error) => {
        console.log(error);
    });
};

// 获取商品详情
const getGoodsDetail = function (goods_sign) {
    return apiClient.execute('pdd.ddk.goods.detail', { pid: config.PDDconfig.pid, goods_sign }).then((res) => {
        if (res.goods_detail_response && res.goods_detail_response.goods_details) {
            return res.goods_detail_response.goods_details[0];
        }
        return null;
    }).catch((error) => {
        console.log(error);
    });
};

const getPromoteLink = async function (source_url) {
    const links = await getLink(source_url);
    if (!links) {
        return Promise.resolve('该宝贝暂无优惠');
    }
    const goods_sign = getUrlParamValByKey(links.url, 'goods_sign');
    if (!goods_sign) {
        return Promise.resolve('该宝贝暂无优惠');
    }
    const short_url = await generateUrl(goods_sign);
    const goods_detail = await getGoodsDetail(goods_sign);
    // const goods_name = goods_detail.goods_name || '';
    // const search_goods_list = await searchGoods(goods_name);
    return new Promise((resolve, reject) => {
        const resultData = {
            platform: '拼多多',
        };
        if (!goods_detail) {
            resolve('该宝贝暂无优惠');
            return;
        }
        resultData.goods_name = goods_detail.goods_name || '';
        const promotion_rate = goods_detail.promotion_rate > 0
            ? goods_detail.promotion_rate / 1000
            : 0;
        const goods_price = goods_detail.min_group_price / 100;
        const money = parseFloat(goods_price * promotion_rate).toFixed(2);

        let result = `您查询的拼多多宝贝：${goods_detail.goods_name}  `;
        if (goods_detail.extra_coupon_amount > 0) {
            resultData.coupon = `${goods_detail.extra_coupon_amount / 100}元`;
            result += `有内部优惠券：${goods_detail.extra_coupon_amount / 100}元  `;
        }
        if (money > 0) {
            resultData.money = money || '';
            result += `预计补贴：${money}元 🧧🧧🧧 `;
        }
        resultData.url = short_url || links.short_url;
        result += `点击下单（有补贴）：${resultData.url} 下单完成请将订单号发送给我，绑定补贴哦！`;
        // console.log(result);
        resolve(resultData);
    });
};

// 获取订单详情
const getOrderDetail = function (order_sn) {
    return apiClient.execute('pdd.ddk.order.detail.get', { order_sn }).then((res) => {
        console.log(res.order_detail_response);
        if (res.order_detail_response) {
            return res.order_detail_response;
        }
        return null;
    }).catch((error) => {
        console.log(error);
    });
};
// 获取订单列表
const getOrderList = function () {
    return apiClient.execute('pdd.ddk.order.list.range.get', {
        start_time: moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'),
        end_time: moment().subtract(5, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
    }).then((res) => {
        console.log(res.order_list_get_response.order_list);
        if (res.order_list_get_response.order_list) {
            return res.order_list_get_response.order_list;
        }
        return null;
    }).catch((error) => {
        console.log(error);
    });
};
const updateOrders = async () => {
    console.log('更新订单中...');
    const orderList = await getOrderList();
    if (orderList && Array.isArray(orderList) && orderList.length > 0) {
        const db_obj = await db_action.connectMongo('taobaoke');
        for (let i = 0; i < orderList.length; i += 1) {
            const item = orderList[i];
            const orders = await db_action.selectOrders(db_obj, { order_id: item.order_sn });
            if (orders.length > 0) {
                await db_action.updateOrder(db_obj, { order_id: item.order_sn }, {
                    order_id: item.order_sn,
                    last_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    platform: 'pdd',
                    order_detail: item,
                    real: 1,
                    orderTime: item.order_create_time ? moment(item.order_create_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    finishTime: item.order_receive_time ? moment(item.order_receive_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    modifyTime: item.order_modify_at ? moment(item.order_modify_at * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    actualFee: Number(item.promotion_amount / 100).toFixed(2) || '',
                    subsidyFee: Number((item.promotion_amount / 100) * config.RAKE).toFixed(2) || '',
                });
            } else {
                await db_action.insertOrder(db_obj, {
                    order_id: item.order_sn,
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    platform: 'pdd',
                    order_detail: item,
                    real: 1,
                    orderTime: item.order_create_time ? moment(item.order_create_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    orderPayTime: item.order_pay_time ? moment(item.order_pay_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    finishTime: item.order_receive_time ? moment(item.order_receive_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    settleTime: item.order_settle_time ? moment(item.order_settle_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    modifyTime: item.order_modify_at ? moment(item.order_modify_at * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    actualFee: Number(item.promotion_amount / 100).toFixed(2) || '',
                    subsidyFee: Number((item.promotion_amount / 100) * config.RAKE).toFixed(2) || '',
                });
            }
        }
        db_obj.conn.close();
    }
    console.log('更新订单完毕...');
};
// const updateOrdersEveryMinute = () => {
//     setSchedule('0 * * * * *', updateOrders)
// }

// let url = 'https://mobile.yangkeduo.com/goods2.html?_wvx=10&refer_share_uin=AKDNTPXMYINS5JHETQKJVRGXXM_GEXDA&refer_share_uid=8111396033479&share_uin=AKDNTPXMYINS5JHETQKJVRGXXM_GEXDA&page_from=205&_wv=41729&refer_share_id=Lr3nfeaNxcPdL0pcKcoKwkpBJzD7q090&refer_share_channel=copy_link&share_uid=8111396033479&pxq_secret_key=IK45E6VZ3JDTOZKAD6PP2WJAGVOZ6JBDUUY6CBTE2VKUMRFSQ54A&goods_id=261568776516'
// getPromoteLink(url)
// getOrderDetail('211221-345820404612637')
module.exports = {
    getPromoteLink,
    getOrderDetail,
    updateOrders,
    // updateOrdersEveryMinute
};
