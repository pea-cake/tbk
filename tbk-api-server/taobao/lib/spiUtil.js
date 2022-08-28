var util = require('./topUtil.js');
var iconv = require('iconv-lite');
var URL = require('url');
var urlencode = require('urlencode');

var ipFileds = ["X-Real-IP", "X-Forwarded-For", "Proxy-Client-IP", "WL-Proxy-Client-IP", "HTTP_CLIENT_IP", "HTTP_X_FORWARDED_FOR"];

String.prototype.contains = function(target){
	return this.indexOf(target) > -1;
}

/**
 * 校验SPI请求签名，不支持带上传文件的HTTP请求。
 *
 * @param bizParams 业务参数
 * @param httpHeaders http头部信息
 * @param secret APP密钥
 * @param charset 目标编码
 * @return boolean
 */
exports.checkSignForSpi = function checkSignForSpi(url,body,httpHeaders,secret) {
	var ctype = httpHeaders['content-type'];
	if(!ctype){
		ctype = httpHeaders['Content-Type'];
	}
	if(!ctype){
		return false;
	}

	var charset = this.getResponseCharset(ctype);
	var urlParams = URL.parse(url).query.split("&");
	var bizParams = buildBizParams(urlParams);
	return checkSignInternal(bizParams,body,httpHeaders,secret,charset);
}

function buildBizParams(urlParams){
	var bizParams = {};
	for(var i =0; i < urlParams.length; i++){
		var params = urlParams[i].split("=");
		bizParams[params[0]] = params[1];
	}
	return bizParams;
}

/**
 * 检查发起SPI请求的来源IP是否是TOP机房的出口IP。
 *
 * @param request HTTP请求
 * @param topIpList TOP网关IP出口地址段列表，通过taobao.top.ipout.get获得
 *
 * @return boolean true表达IP来源合法，false代表IP来源不合法
 */
exports.checkRemoteIp = function checkRemoteIp(httpHeaders,topIpList){
	var ip = null;
	for(var i = 0; i < ipFileds.length; i++){
		var realIp = httpHeaders[ipFileds[i]];
		if(realIp && 'unknown' != realIp.toLowerCase()){
			ip = realIp;
			break;
		}
	}

	if(ip){
		for(var i = 0; i < topIpList.length; i++) {
			if(ip == topIpList[i]){
				return true;
			}
		}
	}
	return false;
}

/**
 * 检查SPI请求到达服务器端是否已经超过指定的分钟数，如果超过则拒绝请求。
 *
 * @return boolean true代表不超过，false代表超过。
 */
exports.checkTimestamp = function checkTimestamp(bizParams,minutes){
	var timestamp = bizParams['timestamp'];
	if(timestamp){
		var remove = new Date(timestamp).getTime();
		var local = new Date().getTime();
		return (local - remove) <= minutes * 60 * 1000;
	}
	return false;
}

function arrayConcat(bizParams,signHttpParams){
	if(signHttpParams){
		for(var i=0; i < signHttpParams.length; i++){
			bizParams[signHttpParams[i].key] = signHttpParams[i].value;
		}
	}
}

function checkSignInternal(bizParams,body,httpHeaders,secret,charset){
	var remoteSign = bizParams['sign'];
	arrayConcat(bizParams,getHeaderMap(httpHeaders));
	var sorted = Object.keys(bizParams).sort();
	var bastString = secret;
	var localSign ;
	for (var i = 0, l = sorted.length; i < l; i++) {
		var k = sorted[i];
		var value = bizParams[k];
		if(k == 'sign'){
			continue;
		}
		value = urlencode.decode(bizParams[k],charset);

		if(k == 'timestamp'){
			value = value.replace('+',' ');
		}
		k = iconv.encode(k,charset);
		bastString += k;
		bastString += value;
	}
	if(body){
		bastString += body;
	}

	bastString += secret;
	var buffer = iconv.encode(bastString,charset);
	localSign = util.md5(buffer).toUpperCase();
	return localSign == remoteSign;
}

function getHeaderMap(httpHeaders){
	var resultMap = {};
	var signList = httpHeaders['top-sign-list'];
	if(signList){
		var targetKeys = signList.split(",");
		targetKeys.forEach(function(target){
			resultMap[target] = httpHeaders[target];
		})
	}
	return resultMap;
}

exports.getResponseCharset = function getResponseCharset(ctype){
	var charset = 'UTF-8';
	if(ctype){
		var params = ctype.split(";");
		for(var i = 0; i < params.length; i++){
			var param = params[i].trim();
			if(param.startsWith('charset')){
				var pair = param.split("=");
				charset = pair[1].trim().toUpperCase();
			}
		}
	}
	if(charset && charset.toLowerCase().startsWith('GB')){
		charset = "GBK";
	}
	return charset;
}
