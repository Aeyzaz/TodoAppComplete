const moment  =  require("moment");
const dbUtils = require('./db');
const ObjectId = require('mongodb').ObjectID;

exports.insertTodo = (userID,todoData) => {
    let db = dbUtils.get();
    let todos = db.collection('Todos');
    let insertedID  = ObjectId();
    return new Promise((resolve, reject) => {
        todos.updateOne({
            _id: userID
        },{
            $addToSet:{
                todo:{
                    id: insertedID,
                    content: todoData,
                    isCompleted: false,
                    shared:[],
                    creationDate: moment().format('DD/MM/YYYY h:m:ss A')
                }
            }
        },{
            upsert: true
        },(err,res)=>{
            if(err){
                throw err;
                reject(err);
            }else{
                resolve({
                    'statusCode': '200',
                    'id': insertedID
                })
            }
        })
    });
};

exports.deleteTodo = (userID,todoID) => {
    let db = dbUtils.get();
    let todos = db.collection('Todos');
    return new Promise((resolve, reject) => {
        todos.updateOne({
            _id: userID
        },{
            $pull:{
                todo:{
                    id: ObjectId(todoID),
                }
            }
        },(err,res)=>{
            if(err){
                throw err;
                reject(err);
            }else{
                resolve(res)
            }
        })
    });
};

exports.listTodos = (userID) => {
    let db = dbUtils.get();
    let todos = db.collection('Todos');
    return new Promise((resolve, reject) => {
        todos.find({_id:userID}).toArray((err,res)=>{
            if(err){
                reject(err);
                throw err;
            }else{
                console.log(res);
                resolve(res)
            }
        })
    });
};

exports.shareTo = async (fromUserID, toUserID, todoID) => {
    let db = dbUtils.get();
    let todos = db.collection('Todos');
    return new Promise((resolve, reject) => {
        todos.updateOne(
            {"todo.id": ObjectId(todoID)},
            {
                $addToSet: {
                    "todo.$.shared": toUserID
                }
            }, (err, res) => {
                if (err) {
                    reject(err);
                    throw err;
                } else {

                    todos.aggregate(
                        {$match:{"todo.id":ObjectId(todoID)}},
                        {$unwind:"$todo"},
                        {$match:{"todo.id":ObjectId(todoID)}},
                        function(err,res){
                            res.toArray((err,r)=>{
                                if(r.length>0){
                                    //console.log(r);
                                    let todoObject  = r[0];
                                    todoObject.todo.shared = [];
                                    todoObject.todo.sharedBy = fromUserID;

                                    //console.log(todoObject.todo);
                                    //console.log(toUserID);

                                    todos.updateOne({
                                        _id: toUserID.toString()
                                    },{
                                        $addToSet:{
                                            todo: todoObject.todo
                                        }
                                    },{
                                        upsert:true
                                    },function(err,res){
                                        if(err){
                                            reject(err);
                                            throw err;
                                        }else{
                                            //console.log(res);
                                            resolve({
                                                'statusCode': '200',
                                                'status': 'Shared'

                                            })
                                        }
                                    });

                                }
                            })
                        }
                    )
                }
            }
        )
    });
};

exports.updateStatus = (userID,todoID,status) => {
    let db = dbUtils.get();
    let todos = db.collection('Todos');

    return new Promise((resolve, reject)=>{
        todos.updateOne({
            _id: userID,
            "todo.id": ObjectId(todoID)
        },{
            $set:{
                "todo.$.isCompleted":status
            }
        },(err,res)=>{
            if(err){
                throw err;
                reject(err);
            }else{
                resolve(res)
            }
        })
    })
};