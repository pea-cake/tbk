const sign = require('./src/sign');
const request = require('./src/request');
const Client = require('./src/client');

const create = (obj = {}) => new Client(obj);

module.exports = {
    sign,
    request,
    create,
};
