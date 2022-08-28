const sign = require('./src/sign')
const request = require('./src/request')
const client = require('./src/client')

const create = (obj = {}) => {
  return new client(obj)
}

module.exports = {
  sign,
  request,
  create
}
