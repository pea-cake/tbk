const { FileBox, UrlLink, MiniProgram } = require('wechaty');
const { delay } = require('../../utils');
/**
 * 私聊发送消息
 * @param contact
 * @param msg
 * @param isRoom
 *  type 1 文字 2 图片url 3 图片base64 4 url链接 5 小程序  6 名片
 */
async function contactSay(contact, msg, isRoom = false) {
    try {
        if (msg.type === 1 && msg.content) {
            // 文字
            console.log('回复内容', msg.content);
            await contact.say(msg.content);
        } else if (msg.type === 2 && msg.url) {
            // url文件
            const obj = FileBox.fromUrl(msg.url);
            await obj.ready();
            console.log('回复内容', obj);
            if (isRoom) {
                await contact.say(`@${contact.name()}`);
                await delay(500);
            }
            await contact.say(obj);
        } else if (msg.type === 3 && msg.url) {
            // bse64文件
            const obj = FileBox.fromDataURL(msg.url, 'user-avatar.jpg');
            await contact.say(obj);
        } else if (msg.type === 4 && msg.url && msg.title && msg.description && msg.thumbUrl) {
            const url = new UrlLink({
                description: msg.description,
                thumbnailUrl: msg.thumbUrl,
                title: msg.title,
                url: msg.url,
            });
            await contact.say(url);
        } else if (msg.type === 5
            && msg.appid
            && msg.title
            && msg.pagePath
            && msg.description
            && msg.thumbUrl
            && msg.thumbKey) {
            const miniProgram = new MiniProgram({
                appid: msg.appid,
                title: msg.title,
                pagePath: msg.pagePath,
                description: msg.description,
                thumbUrl: msg.thumbUrl,
                thumbKey: msg.thumbKey,
            });
            await contact.say(miniProgram);
        }
    } catch (e) {
        console.log('私聊发送消息失败', e);
    }
}

module.exports = {
    contactSay,
};
