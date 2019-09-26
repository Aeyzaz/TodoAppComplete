const dbUtils = require('./db');

/*exports.authenticate = (username, password) => {
    return Promise.resolve({ uid: 1, name: 'Sean', admin: false });
};*/

exports.authenticate = (email, password) => {
    let db = dbUtils.get();
    let users = db.collection('Users');
    return new Promise((resolve, reject) => {
        users.findOne({email, password}, (err, data) => {
            if (err) return reject(err);
            resolve(data); // {uid: 1, name: Sean, admin: false}
        });
    });
};

exports.insert = (userData) => {
    let db = dbUtils.get();
    let users = db.collection('Users');
    return new Promise((resolve, reject) => {
        users.insertOne(userData, (err, data) => {
            if (err) return reject(err);
            resolve(data); // {uid: 1, name: Sean, admin: false}
        });
    });
};

exports.findUserID = (userEmail) => {
    let db = dbUtils.get();
    let users = db.collection('Users');
    return new Promise((resolve, reject)=>{
        users.findOne({email:userEmail},(err,res)=>{
            if (err) return reject(err);
            resolve(res);
        })
    })
};
