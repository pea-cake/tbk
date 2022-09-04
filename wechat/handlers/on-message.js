const { contactSay } = require('../common');
const { getContactTextReply } = require('../common/reply');
const { delay, updateWechatFirend } = require('../../utils');
/**
 * 根据消息类型过滤私聊消息事件
 * @param {*} that bot实例
 * @param {*} msg 消息主体
 */
async function dispatchFriendFilterByMsgType(that, msg) {
    try {
        const type = msg.type();
        const contact = msg.talker(); // 发消息人
        // console.log('联系人===========================》', contact)
        const isOfficial = contact.type() === that.Contact.Type.Official;
        let content = '';
        let replys = [];
        const contactName = contact.name();
        if (contactName.indexOf('recommendation message') == -1) {
            updateWechatFirend(contact);
        }
        switch (type) {
        case that.Message.Type.Text:
            content = msg.text();
            if (!isOfficial) {
                console.log(`发消息人${contactName}:${content}`);
                if (content.trim()) {
                    replys = await getContactTextReply(that, contact, content) || [];
                    for (let i = 0; i < replys.length; i += 1) {
                        const reply = replys[i];
                        await delay(1000);
                        await contactSay(contact, reply);
                    }
                }
            } else {
                console.log('公众号消息');
            }
            break;
        case that.Message.Type.Emoticon:
            console.log(`发消息人${contactName}:发了一个表情`);
            break;
        case that.Message.Type.Image:
            console.log(`发消息人${contactName}:发了一张图片`);
            break;
        case that.Message.Type.Url:
            console.log(`发消息人${contactName}:发了一个链接`);
            break;
        case that.Message.Type.Video:
            console.log(`发消息人${contactName}:发了一个视频`);
            break;
        case that.Message.Type.Audio:
            console.log(`发消息人${contactName}:发了一个视频`);
            break;
        default:
            break;
        }
    } catch (error) {
        console.log('监听消息错误', error);
    }
}

async function onMessage(msg) {
    try {
        const room = msg.room(); // 是否为群消息
        // console.log('roomroomroomroom----------',room)
        const msgSelf = msg.self(); // 是否自己发给自己的消息
        if (msgSelf) return;
        if (room) {
            // 群消息
            const contact = msg.talker(); // 发消息人
        } else {
            await dispatchFriendFilterByMsgType(this, msg);
        }
    } catch (e) {
        console.log('监听消息失败', e);
    }
}

module.exports = onMessage;
