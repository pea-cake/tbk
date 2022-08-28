var util = require('../topUtil.js');
var RestClient = require('./network.js')
var Stream = require('stream')

/**
 * Dingtalk API Client.
 *
 * @param {Object} options.
 * @constructor
 */

function DingtalkClient(options) {
    if (!(this instanceof DingtalkClient)) {
        return new DingtalkClient(options);
    }
    options = options || {};
    this.url = options.url || 'https://eco.taobao.com/router/rest';
}

/**
 * Invoke an api by method name.
 *
 * @param {String} method, method name
 * @param {Object} params
 * @param {Array} reponseNames, e.g. ['tmall_selected_items_search_response', 'tem_list', 'selected_item']
 * @param {Object} defaultResponse
 * @param {Function(err, response)} callback
 */
DingtalkClient.prototype.invoke = function (type,method, params,reponseNames, callback) {
    params.method = method;
    this.request(type,params,function (err, result) {
        if (err) {
            return callback(err);
        }
        var response = result;
        if (reponseNames && reponseNames.length > 0) {
            for (var i = 0; i < reponseNames.length; i++) {
                var name = reponseNames[i];
                response = response[name];
                if (response === undefined) {
                    break;
                }
            }
        }
        callback(null, response);
    });
};

/**
 * Request API.
 *
 * @param {Object} params
 * @param {String} [type='GET']
 * @param {Function(err, result)} callback
 * @public
 */
DingtalkClient.prototype.request = function (type,params,callback) {
    var err = util.checkRequired(params, 'method');
    if (err) {
        return callback(err);
    }
    var args = {
        timestamp: this.timestamp(),
        format: 'json',
        v: '2.0',
        sign_method: 'md5'
    };

    var request = null;
    if(type == 'get'){
        request = RestClient.get(this.url);
    }else{
        request = RestClient.post(this.url);
    }

    for (var key in params) {
        if(typeof params[key] === 'object' && Buffer.isBuffer(params[key])){
            request.attach(key,params[key],{knownLength:params[key].length,filename:key})
        } else if(typeof params[key] === 'object' && Stream.Readable(params[key]) && !util.is(params[key]).a(String)){
            request.attach(key, params[key]);
        } else if(typeof params[key] === 'object'){
            args[key] = JSON.stringify(params[key]);
        } else{
            args[key] = params[key];
        }
    }

    args.sign = this.sign(args);
    for(var key in args){
        request.field(key, args[key]);
    }

    request.end(function(response){
        if(response.statusCode == 200){
            var data = response.body;
            var errRes = data && data.error_response;
            if (errRes) {
                callback(errRes, data);
            }else{
                callback(err, data);
            }
        }else{
            err = new Error('NetWork-Error');
            err.name = 'NetWork-Error';
            err.code = 15;
            err.sub_code = response.statusCode;
            callback(err, null);
        }
    })
};

/**
 * Get now timestamp with 'yyyy-MM-dd HH:mm:ss' format.
 * @return {String}
 */
DingtalkClient.prototype.timestamp = function () {
    return util.YYYYMMDDHHmmss();
};

/**
 * Sign API request.
 * see http://open.taobao.com/doc/detail.htm?id=111#s6
 *
 * @param  {Object} params
 * @return {String} sign string
 */
DingtalkClient.prototype.sign = function (params) {
    var sorted = Object.keys(params).sort();
    var basestring = this.appsecret;
    for (var i = 0, l = sorted.length; i < l; i++) {
        var k = sorted[i];
        basestring += k + params[k];
    }
    basestring += this.appsecret;
    return util.md5(basestring).toUpperCase();
};

/**
 * execute top api
 */
DingtalkClient.prototype.execute = function (apiname,params,callback) {
    this.invoke('post',apiname, params, [util.getApiResponseName(apiname)], callback);
};

DingtalkClient.prototype.get = function (apiname,params,callback) {
    this.invoke('get',apiname, params, [util.getApiResponseName(apiname)], callback);
};

exports.DingtalkClient = DingtalkClient;
