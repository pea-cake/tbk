## jd-union
> 京东联盟Nodejs SDK

### NPM
[
![NPM version](https://img.shields.io/npm/v/jd-union.svg)
![NPM download](https://img.shields.io/npm/dm/jd-union.svg)
![NPM download](https://img.shields.io/npm/dw/jd-union.svg)
](https://www.npmjs.com/package/jd-union)

### 安装
```
npm i -save jd-union
// or
yarn add jd-union
```

### 导入
整个导入
```js
const JdUnion = require('jd-union');
```

按需导入
```js
const {create, sign, request} = require('jd-union');
```

### 使用
创建Api实例
```js
const {create} = require('jd-union');

const api = create(
  {
    appKey: '<联盟分配给应用的appKey>如：eefc33bDRea044cb8ctre5hycf0ac1934',
    appSecret: '<联盟分配给应用的appSecret>如：6d34r0d0kild46460654b42f5e350982',
    serverUrl: '默认为 https://api.jd.com/routerjson'
  }
);

// 调用Api
// api.request(API接口名称, 业务参数); 返回promise
const res = await api.request(
  'jd.union.open.goods.jingfen.query',
  {
    goodsReq: 110
  }
);

// 验签
const signature = api.sign(
  {
    method: 'jd.union.open.goods.query',
    param_json: {'goodsReqDTO': {'keyword': '男装', 'pageSize': 10, 'pageIndex': 1}}, // 0.2.x版本后，key为360buy_param_json或param_json皆可
    v: '1.0',
    access_token: '',
    timestamp: '2018-10-18 11:13:12',
    sign_method: 'md5',
    format: 'json'
  }
);

console.log(signature);
```

单独验签
```js
const {sign} = require('jd-union');

const signature = sign(
  {
    method: 'jd.union.open.goods.query',
    param_json: {"goodsReqDTO":{"keyword":"男装","pageSize":10,"pageIndex":1}}, // 0.2.x版本后，key为360buy_param_json或param_json皆可
    v: '1.0',
    ccess_token: '',
    timestamp: '2018-10-18 11:13:12',
    sign_method: 'md5',
    format: 'json'
  },
  'eefc33bDRea044cb8ctre5hycf0ac1934',
  '6d34r0d0kild46460654b42f5e350982',
  'https://api.jd.com/routerjson'
);

console.log(signature);
```

单独调用Api
```js
const {request} = require('jd-union');

/*
const res = await request('https://router.jd.com/api',
  API接口名称, 
  业务参数, 
  Api版本号, 
  access_token = '', 
  '<联盟分配给应用的appKey>如：eefc33bDRea044cb8ctre5hycf0ac1934', 
  '<联盟分配给应用的appSecret>如：6d34r0d0kild46460654b42f5e350982');
*/
const res = await request(
  'https://api.jd.com/routerjson',
  'jd.union.open.goods.jingfen.query',
  {
    goodsReq: 110
  },
  '1.0',
  '',
  'eefc33bDRea044cb8ctre5hycf0ac1934',
  '6d34r0d0kild46460654b42f5e350982'
);
```
