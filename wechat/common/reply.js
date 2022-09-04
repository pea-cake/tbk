const service = require('../service/msg-filter-service');
/**
 * 获取私聊返回内容
 */
async function getContactTextReply(that, contact, msg) {
    const result = await service.filterFriendMsg(that, contact, msg);
    console.log('result', result);
    return result;
}

module.exports = {
    getContactTextReply,
};
