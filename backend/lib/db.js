let MongoClient  = require("mongodb");
const dotenv = require('dotenv').config();

let connection = null;
let url = process.env.MONGO_URL;
exports.connect = () => new Promise((resolve, reject) => {
    console.log(url);
    MongoClient.connect(url, {useNewUrlParser:true}, function(err, client) {
        if (err) { reject(err); return; };
        let db = client.db('todoAPP');
        resolve(db);
        connection = db;
    });
});

exports.get = () => {
    if(!connection) {
        throw new Error('Call connect first!');
    }
    return connection;
};