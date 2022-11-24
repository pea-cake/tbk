const axios = require('axios');
const moment = require('moment');
const config = require('../../config');
const db_action = require('../db_action');
const pdd = require('../../tbk-api-server/pdd');
const jd = require('../../tbk-api-server/jd');
const utils = require('../../utils');
const msgs = require('../msg');

function emptyMsg() {
    const msgArr = []; // 返回的消息列表
    const obj = { type: 1, content: '我在呢', url: '' }; // 消息主体
    msgArr.push(obj);
    return msgArr;
}

function officialMsg() {
    console.log('无效或官方消息，不做回复');
    return [{ type: 1, content: '', url: '' }];
}

function newFriendMsg({ name }) {
    console.log(`新添加好友：${name}，默认回复`);
    return config.newFriendReplys || [{ type: 1, content: msgs.subscribeMsg, url: '' }];
}

function searchPromoteLink({
    that, msg, id, contact, name,
}) {
    // 查转链链接
    return axios({
        url: 'http://127.0.0.1:3333',
        method: 'GET',
        params: { url: msg },
    }).then(async (res) => {
        console.log('转链结果', res.data);
        if (!res.data) {
            return [{ type: 1, content: '☹该商品暂无优惠和补贴，换一个试试', url: '' }];
        }
        const db_obj = await db_action.connectMongo('taobaoke');
        const customers = await db_action.selectCustomers(db_obj, { wx_id: id });
        const customer = customers[0];
        console.log('转链人：', customer, id);
        db_action.insertTurnLink(db_obj, {
            origin_url: msg,
            platform: utils.getPlatform(msg),
            create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
            turn_content: res.data,
            customer_id: customer._id.toString(),
            customer_name: customer.name || '',
            from: 'wechat',
        }).finally(() => {
            db_obj.conn.close();
        });
        return [
            { type: 1, content: res.data, url: '' },
            { type: 1, content: `下单完成后将【订单号】发送给我！`, url: '' },
        ];
    }).catch((err) => {
        console.log('err', err);
    });
}

async function bindOrder({ messages, id }) {
    // msg用户发的订单号
    let msg = messages;
    if (msg) {
        msg = String(msg).trim();
    }
    let replay_str = '请检查订单号';
    const db_obj = await db_action.connectMongo('taobaoke');
    const customers = await db_action.selectCustomers(db_obj, { wx_id: id });
    const customer = customers[0];
    console.log('绑定订单人：', customer, id);
    if (utils.checkIsJDOrder(msg)) {
        const orders = await db_action.selectOrders(db_obj, { order_id: msg });
        if (orders.length > 0 && orders[0].is_bind) {
            replay_str = '该京东补贴订单已被绑定，不要重复绑定！';
        } else {
            const real_orders = await jd.getOrderList();
            let real_order = null;
            if (real_orders && real_orders.length > 0) {
                real_orders.forEach((item) => {
                    if (item.orderId == msg) {
                        real_order = item;
                    } else if (item.parentId == msg) {
                        real_order = item;
                    }
                });
            }
            if (real_order) {
                await db_action.insertOrder(db_obj, {
                    order_id: msg,
                    is_bind: 1,
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    customer_id: customer._id.toString(),
                    customer_name: customer.name || '',
                    platform: 'jd',
                    parentId: real_order ? real_order.parentId : null,
                    order_detail: real_order,
                    real: real_order ? 1 : 0,
                    goods_name: real_order.skuName,
                    goods_num: real_order.skuNum,
                    orderTime: real_order.orderTime || null,
                    finishTime: real_order.finishTime || null,
                    modifyTime: real_order.modifyTime || null,
                    actualFee: real_order.actualFee,
                    subsidyFee: real_order.actualFee * config.RAKE,
                    estimateCosPrice: real_order.estimateCosPrice, // 预估计佣金额
                    estimateFee: real_order.estimateFee, // 预估全部佣金金额
                    estimateCustomerFee: real_order.estimateFee * config.RAKE, // 预估客户获得佣金金额
                    from: 'wechat',
                });
                replay_str = '您的京东补贴订单绑定成功！';
                if (real_order.estimateCosPrice) {
                    replay_str += `预计本单补贴：${real_order.estimateFee * config.RAKE}元，收货后（5-15天）将以微信🧧方式发送给您，请注意查收！`;
                }
            } else {
                await db_action.insertOrder(db_obj, {
                    order_id: msg,
                    is_bind: 1,
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    customer_id: customer._id.toString(),
                    customer_name: customer.name || '',
                    real: real_order ? 1 : 0,
                    platform: 'jd',
                    from: 'wechat',
                });
                replay_str = '您的京东补贴订单绑定成功！收货后（5-15天）将以微信🧧方式发送给您，请注意查收！';
            }
        }
    }
    // 淘宝订单号
    if (utils.checkIsTBOrder(msg)) {
        const orders = await db_action.selectOrders(db_obj, { order_id: msg });
        if (orders.length > 0) {
            replay_str = '该淘宝补贴订单已被绑定，不要重复绑定！';
        } else {
            await db_action.insertOrder(db_obj, {
                order_id: msg,
                is_bind: 1,
                create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                customer_id: customer._id.toString(),
                customer_name: customer.name || '',
                platform: 'tb',
                from: 'wechat',
            });
            replay_str = '您的淘宝补贴订单绑定成功！收货后（5-15天）将以微信🧧方式发送给您，请注意查收！';
        }
    }
    // 拼多多订单号
    if (utils.checkIsPDDOrder(msg)) {
        const orders = await db_action.selectOrders(db_obj, { order_id: msg });
        if (orders.length > 0 && orders[0].is_bind) {
            replay_str = '该拼多多补贴订单已被绑定，不要重复绑定！';
        } else {
            const order_detail = await pdd.getOrderDetail(msg);
            if (order_detail) {
                await db_action.insertOrder(db_obj, {
                    order_id: msg,
                    is_bind: 1,
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    customer_id: customer._id.toString(),
                    customer_name: customer.name || '',
                    platform: 'pdd',
                    real: order_detail ? 1 : 0,
                    order_detail,
                    orderTime: order_detail.order_create_time ? moment(order_detail.order_create_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    orderPayTime: order_detail.order_pay_time ? moment(order_detail.order_pay_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    finishTime: order_detail.order_receive_time ? moment(order_detail.order_receive_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    settleTime: order_detail.order_settle_time ? moment(order_detail.order_settle_time * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    modifyTime: order_detail.order_modify_at ? moment(order_detail.order_modify_at * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
                    actualFee: Number(order_detail.promotion_amount / 100).toFixed(2) || '',
                    subsidyFee: Number((order_detail.promotion_amount / 100) * config.RAKE).toFixed(2) || '',
                    from: 'wechat',
                });
                replay_str = '您的拼多多补贴订单绑定成功！';
                const subsidyFee = Number((order_detail.promotion_amount / 100) * config.RAKE)
                    .toFixed(2);
                if (subsidyFee) {
                    replay_str += `预计本单补贴：${subsidyFee}元，收货后（5-15天）将以微信🧧方式发送给您，请注意查收！`;
                }
            } else {
                await db_action.insertOrder(db_obj, {
                    order_id: msg,
                    is_bind: 1,
                    create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    customer_id: customer._id.toString(),
                    customer_name: customer.name || '',
                    platform: 'pdd',
                    real: order_detail ? 1 : 0,
                    order_detail: null,
                    from: 'wechat',
                });
                replay_str = '您的拼多多补贴订单绑定成功！收货后（5-15天）将以微信🧧方式发送给您，请注意查收！';
            }
        }
    }
    db_obj.conn.close();
    return [{ type: 1, content: replay_str, url: '' }];
}
/**
 * 关键词回复
 * @returns {Promise<*>}
 */

async function keywordsMsg({ msg }) {
    let res = [];
    try {
        if (config.replyKeywords && config.replyKeywords.length > 0) {
            for (let i = 0; i < Object.keys(config.replyKeywords).length; i += 1) {
                const item = config.replyKeywords[i];
                if (item.reg === 2 && item.keywords.includes(msg)) {
                    console.log(`精确匹配到关键词${msg},正在回复用户`);
                    res = item.replys;
                }
                if (item.reg === 1) {
                    for (let j = 0; j < Object.keys(item.keywords).length; j += 1) {
                        const key = item.keywords[j];
                        if (msg.includes(key)) {
                            console.log(`模糊匹配到关键词${msg},正在回复用户`);
                            res = item.replys;
                        }
                    }
                }
            }
        }
        return res;
    } catch (e) {
        console.log('keywordsMsg error：', e);
        return [];
    }
}

module.exports = {
    emptyMsg,
    officialMsg,
    newFriendMsg,
    keywordsMsg,
    searchPromoteLink,
    bindOrder,
};
