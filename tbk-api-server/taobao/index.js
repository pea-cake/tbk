const getLink = require('./main');
const config = require('../../config');

const getPromoteLink = function (tb_url) {
    return getLink(tb_url).then((res) => {
        const resultData = {
            goods_name: (res && res.short_title) || '',
            platform: '淘宝',
        };
        if (res) {
            if (res.coupon_id) {
                resultData.coupon = `${res.coupon_amount}元 (${res.coupon_info})`;
            }
            resultData.url = `${res.tkl_info.split(' ')[0]}(复制淘口令到淘宝)`;
            if (res.commission_rate > 0) {
                // eslint-disable-next-line max-len
                let money = (Number(res.commission_rate) / (100 * 100)) * (parseFloat(res.zk_final_price) - parseFloat(res.coupon_amount || 0));
                money = (Number(money) * config.RAKE).toFixed(2);
                if ((!Number.isNaN(money)) && money) {
                    resultData.money = money;
                }
            }
            return resultData;
        }
        return null;
    });
};
module.exports = {
    getPromoteLink,
};
