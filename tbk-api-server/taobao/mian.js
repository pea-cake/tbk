const axios = require('axios')
TopClient = require('./lib/api/topClient').TopClient;
const config = require('../../config')
var client = new TopClient({
	'appkey': config.TBconfig.appkey,
	'appsecret': config.TBconfig.appsecret,
	'REST_URL': 'http://gw.api.taobao.com/router/rest'
});

/**
 * 获取淘口令
 * @param {String} url 商品推广链接
 * @returns {String} 淘口令
 */
const getTKL = (url) => {
	console.log('查询tkl:', url)
	return new Promise((resolve, reject) => {
		client.execute('taobao.tbk.tpwd.create', {
			'url': url,
			// 'text':'数据结构JSON示例',
			// 'logo':'数据结构JSON示例',
			// 'ext':'数据结构JSON示例',
			// 'user_id':'数据结构JSON示例'
		}, function (error, response) {
			console.log('查询tkl_res', response)
			if (!error) {
				if (response && response.data && response.data.model) {
					resolve(response.data.model)
				} else {
					resolve(null)
				}
			}
			else {
				resolve(null)
			}
		})
	})
}

/**
 * 淘宝客商品详情查询（简版）
 * @param {String} id 商品id
 * @returns {Object}
 */
const getGoodsDetail = (id) => {
	return new Promise((resolve, reject) => {
		client.execute('taobao.tbk.item.info.get', {
			'num_iids': id,
			// 'platform':'1',
			// 'ip':'11.22.33.43'
		}, function (error, response) {
			if (!error) {
				console.log('====>', response)
				if (response.results && Array.isArray(response.results.n_tbk_item) && response.results.n_tbk_item.length > 0) {
					resolve(response.results.n_tbk_item[0])
				} else {
					resolve(null)
				}
			}
			else { reject(error) };
		})
	})
}

/**
 * 通过商品id对比得到转链商品信息
 * @param {String} goods_id 商品id
 * @param {Array} goods_list 商品列表
 * @returns {String}
 */
const getPromotionInfo = (goods_id, goods_list) => {
	let result = ''
	for (let i = 0; i < goods_list.length; i++) {
		if (goods_list[i].item_id == goods_id) {
			result = goods_list[i]
			break
		}
	}
	return result
}

/**
 * 通过关键词搜索商品
 * @param {String} keyword 关键词
 * @param {String} seller_ids 商家ids
 * @param {Object} search_goods_detail 查询的商品详情信息
 * @param {String} page_result_key 本地化业务入参-分页唯一标识，非首页的请求必传，值为上一页返回结果中的page_result_key字段值
 * @returns {Array}
 */
const getGoodsListByKeyWord = (keyword, page = 1, page_result_key = '') => {
	console.log('keywordkeywordkeywordkeyword', keyword)
	return new Promise((resolve, reject) => {
		client.execute('taobao.tbk.dg.material.optional', {
			// 'start_dsr': '10',
			'page_size': '100',
			'page_no': page,
			// 'platform': '1',
			// 'end_tk_rate': '500',
			// 'start_tk_rate': '6800',
			// 'end_price':'10',
			// 'start_price':'10',
			// 'is_overseas':'false',
			// 'is_tmall':'false',
			'sort': 'match',
			// 'itemloc':search_goods_detail.provcity.split(' ')[1]||'',
			// 'cat':'16,18',
			'q': keyword,
			// 'material_id': '17004',
			// 'has_coupon': 'true',
			// 'ip':'13.2.33.4',
			'adzone_id': '111831150070',
			// 'need_free_shipment':'true',
			// 'need_prepay': 'true',
			// 'include_pay_rate_30': 'true',
			// 'include_good_rate': 'true',
			// 'include_rfd_rate': 'true',
			// 'npx_level': '2',
			// 'end_ka_tk_rate': '0',
			// 'start_ka_tk_rate': '0',
			// 'device_encrypt': 'MD5',
			// 'device_value':'xxx',
			// 'device_type': 'IMEI',
			// 'lock_rate_end_time':'1567440000000',
			// 'lock_rate_start_time':'1567440000000',
			// 'longitude':'121.473701',
			// 'latitude':'31.230370',
			// 'city_code':'310000',
			// 'seller_ids':search_goods_detail.seller_id||'',
			// 'special_id':'2323',
			// 'relation_id':'3243',
			// 'page_result_key': page_result_key,
			// 'ucrowd_id':'1',
			// 'ucrowd_rank_items':'数据结构JSON示例',
			'get_topn_rate': '0'
		}, function (error, response) {
			if (!error) {
				let result_list = response.result_list || null
				let map_data = result_list.map_data || null
				if (Array.isArray(map_data) && map_data.length > 0) {
					resolve({
						total_results: response.total_results,
						map_data: map_data
					})
				} else {
					resolve(null)
				}
			}
			else { reject(error) };
		})
	})
}


/**
 * 从链接里提取参数值
 * @param {String} url 
 * @param {String} key 
 * @returns {String}
 */
const getUrlParamValByKey = (url, key) => {
	if (!url) {
		return null
	}
	url = url.replace(new RegExp('&amp;', 'g'), "&");
	let str = url.split('?')[1]
	let arr = str.split('&')
	let res = ''
	arr.forEach(element => {
		let k = element.split('=')[0]
		let v = element.split('=')[1]
		if (key == k) {
			res = v
		}
	});
	return res
}

const httpString = (s) => {
	let reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
	s = s.match(reg);
	if (s && s.length > 0) {
		s = s[0]
	}
	return (s)
}

const getLastPromotionInfo = async (goods_url) => {
	let result_item = null
	let goodsId = getUrlParamValByKey(goods_url, 'id')
	if (!goodsId) {
		await axios.get(goods_url).then(res => {
			goods_url = httpString(res.data)
		})
	}
	goodsId = getUrlParamValByKey(goods_url, 'id')
	console.log('商品id====>', goodsId)
	if (!goodsId) {
		return null
	}
	let goodDetail = await getGoodsDetail(goodsId).catch(err => {
		console.log('err', err)
	})
	if (!goodDetail) {
		return null
	}
	let is_err = false
	let jsonData = await getGoodsListByKeyWord(goodDetail.title).catch(err => {
		console.log('=====', err)
		is_err = true
	})
	if (is_err) {
		return null
	}
	let my_goods_list = jsonData.map_data
	let total = jsonData.total_results
	console.log('总数', total)
	result_item = getPromotionInfo(goodsId, my_goods_list)
	if (result_item) {
		// console.log('找到了===>',result_item)
		let goods_url = 'https:'
		if (result_item.coupon_id) {
			goods_url += result_item.coupon_share_url
		} else {
			goods_url += result_item.url
		}
		let tkl_info = await getTKL(goods_url)
		result_item.tkl_info = tkl_info || null
		return result_item
	}
	let pages = 1
	if (total > 100) {
		pages = Math.ceil(total / 100)
	}
	if (pages > 10) {
		pages = 10
	}
	if (pages > 1) {
		for (let i = 1; i <= pages; i++) {
			let is_continue = false
			let res = await getGoodsListByKeyWord(goodDetail.title).catch(err => {
				console.log('=====', err)
				is_continue = true
			})
			if (is_continue) {
				continue
			}
			if (res && res.map_data && res.map_data.length > 0) {
				result_item = getPromotionInfo(goodsId, res.map_data)
				if (result_item) {
					// console.log('找到了===>',result_item)
					let goods_url = 'https:'
					if (result_item.coupon_id) {
						goods_url += result_item.coupon_share_url
					} else {
						goods_url += result_item.url
					}
					let tkl_info = await getTKL(goods_url)
					result_item.tkl_info = tkl_info || null
					return result_item
				}
			}
		}
	}
	return result_item
}

module.exports = getLastPromotionInfo