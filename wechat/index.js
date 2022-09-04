/**
 * WechatBot
 *  - https://github.com/gengchen528/wechatBot
 */
const { WechatyBuilder } = require('wechaty');
const qrcodeTerminal = require('qrcode-terminal');
const schedule = require('../schedule/index');
const config = require('../config/index');
const onFriend = require('./handlers/on-friend');
const onMessage = require('./handlers/on-message');

// 延时函数，防止检测出类似机器人行为操作
function delay(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

// 二维码生成
function onScan(qrcode, status) {
    if (qrcode) {
        console.log(qrcode);
        const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
        ].join('');
        console.info('StarterBot', 'onScan: %s(%s) - %s', status, qrcodeImageUrl);

        qrcodeTerminal.generate(qrcode, { small: true }); // show qrcode on console
        console.info(`[${status}] ${qrcode}\nScan QR Code above to log in: `);
    } else {
        console.info(`[${status}]`);
    }
}

const bot = WechatyBuilder.build({
    name: 'puppet-wechat',
    puppetOptions: {
        uos: true, // 开启uos协议
    },
    puppet: 'wechaty-puppet-wechat',
});

// 创建微信心跳任务
async function initHeart() {
    schedule.setSchedule(config.heartService.SENDDATE, async () => {
        let logMsg;
        const contact = (await bot.Contact.find({ name: config.service.vx }))
            || (await bot.Contact.find({ alias: config.heartService.vx }));
        const str = 'alive';
        try {
            logMsg = str;
            await delay(2000);
            await contact.say(str); // 发送消息
        } catch (e) {
            logMsg = e.message;
        }
        console.log(logMsg);
    });
}
// 登录
async function onLogin(user) {
    console.log(`淘宝客微信bot${user}登录了`);
    const date = new Date();
    console.log(`当前容器时间:${date}`);
    await initHeart();
}

// 登出
function onLogout(user) {
    console.log(`淘宝客微信bot${user} 已经登出`);
}

async function onReady() {
    console.log('ready');
    //   const contactList = await bot.Contact.findAll()
    //   console.info('Total number of contacts:', contactList.length)
    //   for (let i = 0; i < contactList.length; i++) {
    //     const contact = contactList[i]
    //     console.log('contact',contact)
    //     if (contact.type()==bot.Contact.Type.Individual) {
    //       await utils.updateWechatFirend(contact)
    //     }
    //   }
}

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on('message', onMessage);
bot.on('friendship', onFriend);
bot.on('ready', onReady);

bot
    .start()
    .then(() => console.log('开始登陆微信'))
    .catch((e) => console.error(e));
