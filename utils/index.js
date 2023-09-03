const moment = require('moment');
const config = require('../config');
const db_action = require('../wechat/db_action');

function getHttpString(s) {
    let res = '';
    const reg = /(https?|http|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    if (s) {
        res = s.match(reg) || '';
    }
    console.log(res);
    if (res && res.length > 0) {
        return res[0];
    }
    return res;
}
function getDay(date) {
    const date2 = new Date();
    const date1 = new Date(date);
    const iDays = parseInt((Math.abs(date2.getTime() - date1.getTime()) / 1000 / 60 / 60 / 24), 10);
    return iDays;
}

function formatDate(date) {
    const tempDate = new Date(date);
    const year = tempDate.getFullYear();
    const month = tempDate.getMonth() + 1;
    const day = tempDate.getDate();
    let hour = tempDate.getHours();
    let min = tempDate.getMinutes();
    let second = tempDate.getSeconds();
    const week = tempDate.getDay();
    let str = '';
    if (week === 0) {
        str = '星期日';
    } else if (week === 1) {
        str = '星期一';
    } else if (week === 2) {
        str = '星期二';
    } else if (week === 3) {
        str = '星期三';
    } else if (week === 4) {
        str = '星期四';
    } else if (week === 5) {
        str = '星期五';
    } else if (week === 6) {
        str = '星期六';
    }
    if (hour < 10) {
        hour = `0${hour}`;
    }
    if (min < 10) {
        min = `0${min}`;
    }
    if (second < 10) {
        second = `0${second}`;
    }
    return `${year}-${month}-${day}日 ${hour}:${min} ${str}`;
}
/**
 * 延时函数
 * @param {*} ms 毫秒
 */
async function delay(ms) {
    return new Promise((resolve) => { setTimeout(() => { resolve(); }, ms); });
}
function checkIsJDOrder(str) {
    const re = /^[0-9]{12}$/;
    return re.test(str);
}
function checkIsTBOrder(str) {
    const re = /^[0-9]{19}$/;
    return re.test(str);
}
function checkIsPDDOrder(str) {
    if (str && str.length > 6 && str[6] === '-') {
        const re = /^[0-9|-]{22}$/;
        return re.test(str);
    }
    return false;
}
function checkOrder(str) {
    console.log('--------', str);
    if (str) {
        // eslint-disable-next-line no-param-reassign
        str = str.trim();
        if (checkIsJDOrder(str)) {
            return true;
        }
        if (checkIsTBOrder(str)) {
            return true;
        }
        if (checkIsPDDOrder(str)) {
            return true;
        }
        return false;
    }
    return false;
}
function getPlatform(url) {
    if (!url) {
        return '';
    }
    if (url.indexOf('jd.com') != -1) {
        return 'jd';
    }
    if (url.indexOf('tb.cn') != -1) {
        return 'tb';
    }
    if (url.indexOf('yangkeduo.com') != -1) {
        return 'pdd';
    }
    return '';
}
function formatReplayStr(content) {

    if (content.platform === '京东') {
        let result = `------【粉丝福利购】------
        ${content.goods_name || '你的宝贝'}
        
        可补：${content.money || '无'}
        倦：${content.coupon || '无'}
        付：${content.price || '无'}
        
        点连接芐單: ${content.url || '无'}
          `;
    } else {
        let result = `------【粉丝福利购】------
        ${content.goods_name || '你的宝贝'}
        
        可补：${content.money || '无'}
        倦：${content.coupon || '无'}
        付：${content.price || '无'}
        
        【长按腹制本条信息，然后打开「陶 宝」会自动弹出芐単入口】${content.url || '无'}
            `;
    }
    if (!content.coupon && !content.money) {
        result = '';
    }
    return result;
}

const updateWechatFirend = function (contact) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        const contactName = contact.name();
        const db_obj = await db_action.connectMongo('taobaoke');
        const customers = await db_action.selectCustomers(db_obj, { wx_id: contact.id });
        if (customers.length > 0) {
            // 客户已存在
            // 更新last_time字段
            const update_user_data = {
                new_name: contactName,
                last_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                is_friend: contact.friend(),
                gender: contact.gender(),
                city: contact.city(),
                province: contact.province(),
                from: 'wechat',
            };
            const phone = contact.phone() || contact.payload.phone;
            if (phone && Array.isArray(phone) && phone.length > 0) {
                update_user_data.new_phone = phone;
            }

            let new_alias = await contact.alias();
            if (contact.payload.alias) {
                new_alias = contact.payload.alias;
            }
            if (new_alias) {
                update_user_data.new_alias = new_alias;
            }

            let avatar = await contact.avatar();
            if (contact.payload.avatar) {
                avatar = contact.payload.avatar;
            }
            if (avatar) {
                update_user_data.avatar = avatar;
            }

            const type = contact.type() || contact.payload.type;
            if (type != '') {
                update_user_data.type = type;
            }
            await db_action.updateCustomer(
                db_obj,
                {
                    wx_id: contact.id,
                },
                update_user_data,
            );
        } else {
            // 插入新客户
            await db_action.insertCustomer(db_obj, {
                wx_id: contact.id,
                name: contactName,
                phone: contact.phone() || contact.payload.phone,
                alias: contact.alias() || contact.payload.alias,
                avatar: contact.avatar() || contact.payload.avatar,
                create_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                is_friend: contact.friend(),
                gender: contact.gender(),
                city: contact.city(),
                province: contact.province(),
                type: contact.type() || contact.payload.type,
                from: 'wechat',
            });
        }
        db_obj.conn.close();
        resolve();
    });
};
module.exports = {
    getHttpString,
    getDay,
    formatDate,
    delay,
    checkOrder,
    getPlatform,
    checkIsJDOrder,
    checkIsTBOrder,
    checkIsPDDOrder,
    formatReplayStr,
    updateWechatFirend,
};
