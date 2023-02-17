const TopClient = require("./lib/api/topClient");
const config = require("../../config");

const client = new TopClient.TopClient({
    appkey: config.TBconfig.appkey,
    appsecret: config.TBconfig.appsecret,
    REST_URL: "http://gw.api.taobao.com/router/rest",
});

/**
 * 获取淘口令
 * @param {String} url 商品推广链接
 * @returns {String} 淘口令
 */
const getTKL = (url) => {
    console.log("查询tkl:", url);
    return new Promise((resolve, reject) => {
        client.execute(
            "taobao.tbk.tpwd.create",
            {
                url,
                // 'text':'数据结构JSON示例',
                // 'logo':'数据结构JSON示例',
                // 'ext':'数据结构JSON示例',
                // 'user_id':'数据结构JSON示例'
            },
            (error, response) => {
                console.log("查询tkl_res", response);
                if (!error) {
                    let res = "";
                    if (response && response.data) {
                        if (response.data.model) {
                            res = response.data.model;
                        }
                        if (response.data.password_simple) {
                            res = response.data.password_simple;
                        }
                    } else {
                        res = null;
                    }
                    resolve(res);
                } else {
                    resolve(null);
                }
            },
        );
    });
};

const getGoodsId = (click_url) => new Promise((resolve, reject) => {
    client.execute(
        "taobao.tbk.item.click.extract",
        {
            click_url,
            // 'platform':'1',
            // 'ip':'11.22.33.43'
        },
        (error, response) => {
            if (!error) {
                // console.log("extract====>", response);
                resolve();
                // eslint-disable-next-line max-len
                // if (response.results && Array.isArray(response.results.n_tbk_item) && response.results.n_tbk_item.length > 0) {
                //     resolve(response.results.n_tbk_item[0]);
                // } else {
                //     resolve(null);
                // }
            } else {
                reject(error);
            }
        },
    );
});

/**
 * 淘宝客商品详情查询（简版）
 * @param {String} id 商品id
 * @returns {Object}
 */
const getGoodsDetail = (id) => new Promise((resolve, reject) => {
    client.execute(
        "taobao.tbk.item.info.get",
        {
            num_iids: id,
            // 'platform':'1',
            // 'ip':'11.22.33.43'
        },
        (error, response) => {
            if (!error) {
                // console.log("====>", response);
                // eslint-disable-next-line max-len
                if (
                    response.results
                        && Array.isArray(response.results.n_tbk_item)
                        && response.results.n_tbk_item.length > 0
                ) {
                    resolve(response.results.n_tbk_item[0]);
                } else {
                    resolve(null);
                }
            } else {
                reject(error);
            }
        },
    );
});

/**
 * 通过商品id对比得到转链商品信息
 * @param {String} goods_id 商品id
 * @param {Array} goods_list 商品列表
 * @returns {String}
 */
const getPromotionInfo = (goods_id, goods_list) => {
    let result = "";
    for (let i = 0; i < goods_list.length; i += 1) {
        if (goods_list[i].item_id == goods_id) {
            result = goods_list[i];
            break;
        }
    }
    return result;
};

/**
 * 通过关键词搜索商品
 * @param {String} keyword 关键词
 * @param {String} seller_ids 商家ids
 * @param {Object} search_goods_detail 查询的商品详情信息
 * @param {String} page_result_key 本地化业务入参-分页唯一标识，非首页的请求必传，值为上一页返回结果中的page_result_key字段值
 * @returns {Array}
 */
const getGoodsListByKeyWord = (keyword, page = 1, page_result_key = "") =>
    // console.log("keywordkeywordkeywordkeyword", keyword);
    new Promise((resolve, reject) => {
        client.execute(
            "taobao.tbk.dg.material.optional",
            {
                // 'start_dsr': '10',
                page_size: "100",
                page_no: page,
                // 'platform': '1',
                // 'end_tk_rate': '500',
                // 'start_tk_rate': '6800',
                // 'end_price':'10',
                // 'start_price':'10',
                // 'is_overseas':'false',
                // 'is_tmall':'false',
                sort: "match",
                // 'itemloc':search_goods_detail.provcity.split(' ')[1]||'',
                // 'cat':'16,18',
                q: keyword,
                // 'material_id': '17004',
                // 'has_coupon': 'true',
                // 'ip':'13.2.33.4',
                adzone_id: config.TBconfig.adzone_id,
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
                get_topn_rate: "0",
            },
            (error, response) => {
                if (!error) {
                    const result_list = response.result_list || null;
                    const map_data = result_list.map_data || null;
                    if (Array.isArray(map_data) && map_data.length > 0) {
                        // console.log(response.total_results);
                        // console.log(map_data);
                        resolve({
                            total_results: response.total_results,
                            map_data,
                        });
                    } else {
                        resolve(null);
                    }
                } else {
                    reject(error);
                }
            },
        );
    })
;

/**
 * 从链接里提取参数值
 * @param {String} url
 * @param {String} key
 * @returns {String}
 */
const getUrlParamValByKey = (url, key) => {
    let clone_url = url;
    if (!clone_url) {
        return null;
    }
    clone_url = clone_url.replace(/&amp;/g, "&");
    const str = clone_url.split("?")[1];
    const arr = str.split("&");
    let res = "";
    arr.forEach((element) => {
        const k = element.split("=")[0];
        const v = element.split("=")[1];
        if (key == k) {
            res = v;
        }
    });
    return res;
};

const httpString = (s) => {
    let res = s;
    const reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    res = res.match(reg);
    if (res && res.length > 0) {
        return res[0];
    }
    return res;
};

const getLastPromotionInfo = async (into_goods_url) => {
    const keyword = into_goods_url.match(/「(\S*)」/)[1];
    let result_item = null;
    let is_err = false;
    const jsonData = await getGoodsListByKeyWord(keyword).catch((err) => {
        console.log("=====", err);
        is_err = true;
    });
    if (is_err) {
        return null;
    }
    const my_goods_list = jsonData.map_data;
    const total = jsonData.total_results;
    console.log("总数", total);
    if (Array.isArray(my_goods_list) && my_goods_list.length > 0) {
        result_item = my_goods_list[0];
    }
    if (!result_item) {
        return null;
    }
    let goods_url = "https:";
    if (result_item.coupon_share_url) {
        goods_url += result_item.coupon_share_url;
    } else if (result_item.url) {
        goods_url += result_item.url;
    } else {
        return null;
    }
    const tkl_info = await getTKL(goods_url);
    result_item.tkl_info = tkl_info || null;
    return result_item;
};

module.exports = getLastPromotionInfo;
