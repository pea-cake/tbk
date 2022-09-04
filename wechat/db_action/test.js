const { ObjectId } = require('mongodb');
const db_action = require('./index');

async function main() {
    const db_obj = await db_action.connectMongo('taobaoke');
    const customers = await db_action.selectCustomers(db_obj, { _id: ObjectId('61bf8e63d7ea1e8adfff90fe') });
    const customer = customers[0];
    console.log(customer);
}
main();
