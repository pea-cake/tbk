const msgFilter = require('./msg-filters');
const { checkOrder } = require('../../utils');

const WEIXINOFFICIAL = ['朋友推荐消息', '微信支付', '微信运动', '微信团队', 'recommendation message']; // 微信官方账户，针对此账户不做任何回复
const DELETEFRIEND = '开启了朋友验证'; // 被人删除后，防止重复回复
const REMINDKEY = '提醒';
const NEWADDFRIEND = '你已添加';
const SHOP_SITES = ['tb.cn', 'taobao.com', 'jd.com', 'pinduoduo.com', 'yangkeduo.com']; // 转链支持网站

function isIncludes(arr, str) {
    let res = false;
    arr.forEach((item) => {
        if (str.includes(item)) {
            res = true;
        }
    });
    return res;
}

async function getMsgReply(resArray, {
    that, msg, name, contact, avatar, id, room,
}) {
    try {
        let msgArr = [];
        for (let i = 0; i < resArray.length; i += 1) {
            const item = resArray[i];
            if (item.bool) {
                msgArr = (await msgFilter[item.method]({
                    that, msg, name, contact, avatar, id, room,
                })) || [];
            }
            if (msgArr.length > 0) {
                return msgArr;
            }
        }
        return [];
    } catch (e) {
        console.log('getMsgReply error', e);
        return [];
    }
}

/**
 * 微信好友文本消息事件过滤
 *
 * @param that wechaty实例
 * @param {Object} contact 发消息者信息
 * @param {string} msg 消息内容
 * @returns {number} 返回回复内容
 */
async function filterFriendMsg(that, contact, msg) {
    let msgArr = [];
    try {
        const name = contact.name();
        const { id } = contact;
        const avatar = await contact.avatar();
        const resArray = [
            { bool: msg === '', method: 'emptyMsg' },
            { bool: msg.includes(DELETEFRIEND) || WEIXINOFFICIAL.includes(name), method: 'officialMsg' },
            { bool: msg.includes(NEWADDFRIEND), method: 'newFriendMsg' },
            { bool: msg.startsWith(REMINDKEY), method: 'scheduleJobMsg' },
            { bool: isIncludes(SHOP_SITES, msg), method: 'searchPromoteLink' },
            { bool: checkOrder(msg), method: 'bindOrder' },
            { bool: true, method: 'keywordsMsg' },
        ];
        msgArr = await getMsgReply(resArray, {
            that, msg, contact, name, avatar, id,
        });
    } catch (e) {
        console.log('filterFriendMsg error', e);
    }
    return msgArr && msgArr.length > 0 ? msgArr : [];
}

module.exports = {
    filterFriendMsg,
};
