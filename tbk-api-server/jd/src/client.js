const sign = require('./sign');
const request = require('./request');
const {DEFAULT_SERVER} = require('./constants');

module.exports = class Client {
    constructor(obj = {}) {
        this.setConfig(obj);
    }

    setConfig(obj = {}) {
        const {appKey, appSecret, serverUrl} = obj;
        if (typeof appKey !== 'string' || appKey.length < 1) {
            throw new Error('请正确填写app_key，类型为字符串');
        }
        if (typeof appSecret !== 'string' || appSecret.length < 1) {
            throw new Error('请正确填写appSecret，类型为字符串');
        }
        this.appKey = appKey;
        this.appSecret = appSecret;
        this.serverUrl = serverUrl || DEFAULT_SERVER;
    }

    async request(method, param_json, version = '1.0', access_token = '') {
        const {appKey, appSecret, serverUrl} = this;
        return await request(serverUrl, method, param_json, version, access_token, appKey, appSecret);
    }

    sign(obj) {
        const {appKey, appSecret, serverUrl} = this;
        return sign(obj, appKey, appSecret, serverUrl);
    }

};
