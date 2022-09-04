// const moment = require('moment')
const { MongoClient } = require('mongodb');

const con_url = "mongodb://localhost:27017/";

const connectMongo = (dbase_name) => MongoClient.connect(con_url).then((conn) => {
    console.log("数据库已连接");
    const dbase = conn.db(dbase_name);
    return {
        conn,
        dbase,
    };
}).catch((err) => {
    console.log("数据库连接失败");
});

const insertData = (mongoObj, collection_name, data) => {
    const table = mongoObj.dbase.collection(collection_name);
    // 增加
    return table.insertOne(data).then((res) => {
        console.log("已插入数据成功");
    }).catch((err) => {
        console.log("插入数据错误", err);
    });
};

const updateData = (mongoObj, collection_name, query, update_data) => {
    const table = mongoObj.dbase.collection(collection_name);
    // 修改
    return table.updateOne(query, { $set: update_data }).then((res) => {
        console.log("修改数据成功");
    }).catch((err) => {
        console.log("修改数据错误", err);
    });
};

const selectData = (mongoObj, collection_name = '', data = null) => {
    const girls_table = mongoObj.dbase.collection(collection_name);
    // 查询
    return girls_table.find(data).toArray().then((res) => {
        console.log("查询数据成功");
        return res;
    }).catch((err) => {
        console.log("查询数据错误", err);
    });
};

const insertCustomer = (mongoObj, data) => insertData(mongoObj, 'customers', data);
const selectCustomers = (mongoObj, data) => selectData(mongoObj, 'customers', data);
const updateCustomer = (mongoObj, query, data) => updateData(mongoObj, 'customers', query, data);
const insertOrder = (mongoObj, data) => insertData(mongoObj, 'orders', data);
const selectOrders = (mongoObj, data) => selectData(mongoObj, 'orders', data);
const updateOrder = (mongoObj, query, data) => updateData(mongoObj, 'orders', query, data);
const insertTurnLink = (mongoObj, data) => insertData(mongoObj, 'turnlinks', data);
const selectTurnLinks = (mongoObj, data) => selectData(mongoObj, 'turnlinks', data);
const updateTurnLink = (mongoObj, query, data) => updateData(mongoObj, 'turnlinks', query, data);

async function test() {
    const mongoObj = await connectMongo('taobaoke');
    const insterData = { name: 'xuhaha', age: 15 };
    await insertData(mongoObj, 'users', insterData);
}
module.exports = {
    connectMongo,
    selectData,
    insertData,
    insertCustomer,
    selectCustomers,
    updateCustomer,
    insertOrder,
    selectOrders,
    updateOrder,
    insertTurnLink,
    selectTurnLinks,
    updateTurnLink,
};
