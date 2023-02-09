const http = require('http');
const qs = require('qs');
const parseUrl = require('url');
const taobaoSDK = require('./taobao');
const jdSDK = require('./jd');
const pddSDK = require('./pdd');
const { getHttpString, formatReplayStr } = require('../utils');

// 创建淘宝客api服务
http.createServer(async (request, response) => {
    // 解析请求，包括文件名
    const router = parseUrl.parse(request.url);
    console.log('请求地址：', router.pathname);
    const { query } = router;
    const params = qs.parse(query);
    console.log('接收到的url参数', params);
    let responseData = {};
    const goal_url = getHttpString(params.url);
    if (goal_url.indexOf('tb.cn') != -1 || goal_url.indexOf('taobao.com') != -1) {
        // 未处理的url参数直接传入，主要就是'「'和'」'之间的关键词，如'「绿联八类网线万兆cat8七类7六6类千兆超家用宽带电脑路由器网络线」'
        const res = await taobaoSDK.getPromoteLink(params.url);
        if (res) {
            responseData = res;
        }
    } else if (goal_url.indexOf('jd.com') != -1) {
        responseData = await jdSDK.getPromotionReply(goal_url);
    } else if (goal_url.indexOf('yangkeduo.com') != -1 || goal_url.indexOf('pinduoduo.com') != -1) {
        responseData = await pddSDK.getPromoteLink(goal_url);
    } else {
        responseData = {};
    }
    // 输出请求的文件名
    response.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' });
    //  发送响应数据
    // 响应文件内容
    responseData = formatReplayStr(responseData);
    response.write(responseData);
    response.end();
}).listen(3333);

// 控制台会输出以下信息
console.log('Server running at http://127.0.0.1:3333/');
