const req = require('request-promise');
const format = require('dateformat');
const sign = require('./sign');
const {DEFAULT_SERVER} = require('./constants');

module.exports = async (url = DEFAULT_SERVER, method, param_json, version = '1.0', access_token = '', app_key = '', app_secret = '') => {
    const isNewVersion = url === DEFAULT_SERVER;
    const qs = {
        method,
        v: version,
        access_token,
        app_key,
        timestamp: format(new Date(), 'yyyy-mm-dd HH:MM:ss'),
        sign_method: 'md5',
        format: 'json'
    };
    const params = typeof param_json === 'object' ? JSON.stringify(param_json) : param_json;
    if (isNewVersion) {
        qs['360buy_param_json'] = params;
    } else {
        qs['param_json'] = params;
    }
    qs.sign = sign(qs, app_key, app_secret, url);
    return await req({
        uri: url,
        qs,
        json: true
    });
};
