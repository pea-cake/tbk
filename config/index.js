const msgs = require('../wechat/msg');
// 配置文件
module.exports = {
    RAKE: 0.92, // 返利给用户的比例
    JDconfig: {
        // 京东联盟
        appKey: "",
        appSecret: "",
    },
    TBconfig: {
        // 阿里联盟
        appkey: "",
        appsecret: "",
        adzone_id: "", // 推广位pid 'mm_123_456_789' 的789就是adzone_id  获取链接 https://pub.alimama.com/third/manage/record/adzone.htm
    },
    PDDconfig: {
        // 多多客
        clientId: "",
        clientSecret: "",
        pid: "", // 推广位pid
    },
    autoAcceptFriend: true, // 自动接受好友
    acceptFriendKeyWords: [], // 接受好友认证关键词
    newFriendReplys: [{ type: 1, content: msgs.subscribeMsg, url: '' }], // 新好友回复
    replyKeywords: [
        {
            reg: 1,
            keywords: ['查', '优惠', '券', '京东', '淘宝', '拼多多'],
            replys: [{ type: 1, content: msgs.useMsg, url: '' }],
        },
        {
            reg: 1,
            keywords: ['你好', '打招呼', '我是', '已添加', 'hello', '哈喽'],
            replys: [{ type: 1, content: msgs.subscribeMsg, url: '' }],
        },
        {
            reg: 1,
            keywords: ['你是', '你叫啥'],
            replys: [{ type: 1, content: `我是购物您的小助手,${msgs.useMsg}`, url: '' }],
        },
    ],
    heartService: { // 检测登录状态，暂时先别用了，容易封号提醒
        SENDDATE: '00 00 * * * *', // 定时发送时间 每小时发送一次，规则见 /schedule/index.js
        vx: '', // 微信心跳发送人，微信号或昵称
    },
};
