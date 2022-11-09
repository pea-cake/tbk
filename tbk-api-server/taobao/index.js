const getLink = require('./main')
const config = require('../../config')
let getPromoteLink = function (tb_url) {
    return getLink(tb_url).then(res => {
        let resultData = {
            goods_name: res && res.short_title || '',
            platform: '淘宝'
        }
        if (res) {
            if (res.coupon_id) {
                resultData.coupon = res.coupon_amount + '元 (' + res.coupon_info + ')'
            }
            resultData.url = res.tkl_info.split(' ')[0] + '(复制淘口令到淘宝)'
            if (res.commission_rate > 0) {
                let money = (Number(res.commission_rate) / (100 * 100)) * (parseFloat(res.zk_final_price) - parseFloat(res.coupon_amount || 0))
                money = (Number(money) * config.RAKE).toFixed(2)
                if (money != NaN && money) {
                    resultData.money = money
                }
            }
            return resultData
        } else {
            return null
        }
    })
}
module.exports = {
    getPromoteLink,
}