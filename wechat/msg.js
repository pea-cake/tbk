const newTip = '我是购物小助手：现已支持 京东、淘宝、拼多多平台查询商品优惠券，下单后还可拿补贴！';
const useMsg = `
【食用步骤】如下：
1.复制淘宝商品/京东/拼多多商品链接发给我
2.即可看到补贴详细信息，领取优惠券并下单
3.付款后复制订单号给我绑定补贴
4.补贴将在收货完成5-15天内，通过微信🧧方式发送给您

`;
// const menuBtn = '<a href="weixin://bizmsgmenu?msgmenuid=1&msgmenucontent=菜单">更多功能</a>'

const menuMsg = ``;

const commonMsg = `输入的内容有误，你是想查商品优惠券和补贴信息吗?${useMsg}`;

const subscribeMsg = `亲，终于等到了您！${menuMsg}${newTip}${useMsg}`;

module.exports = {
    subscribeMsg,
    menuMsg,
    commonMsg,
    useMsg,
};
