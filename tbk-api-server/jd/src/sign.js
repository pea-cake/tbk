const md5 = require('md5');
const {DEFAULT_SERVER} = require('./constants');

module.exports = (obj = {}, app_key = '', app_secret = '', url = DEFAULT_SERVER) => {
    const isNewVersion = url === DEFAULT_SERVER;
    const list = [];
    if (typeof obj['app_key'] === 'undefined') {
        obj['app_key'] = app_key;
    }
    const params = obj['360buy_param_json'] || obj['param_json'];
    if (isNewVersion) {
        delete obj['param_json'];
        obj['360buy_param_json'] = params;
    } else {
        delete obj['360buy_param_json'];
        obj['param_json'] = params;
    }
    Object.keys(obj).sort().forEach(key => {
        const value = obj[key];
        if (key !== 'access_token' || key!='format' || (typeof value === 'string' && value.length > 0)) {
            list.push(`${key}${typeof value === 'object' ? JSON.stringify(value) : value}`);
        }
    });
    // console.log('list--->',list)
    const signStr = `${app_secret}${list.join('')}${app_secret}`;
    // console.log('signStr--->',signStr)
    return md5(signStr).toUpperCase();
};
