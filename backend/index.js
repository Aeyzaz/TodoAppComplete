var restify = require('restify');
const dbUtil = require('./lib/db');
const rjwt = require('restify-jwt-community');
const jwt = require('jsonwebtoken');
const corsMiddleware = require("restify-cors-middleware");
const config = require('./config');
const user = require('./lib/user');
const todos = require('./lib/todos');

var server = restify.createServer();

const cors = corsMiddleware({
    origins: ["*"],
    allowHeaders: ["Authorization"],
    exposeHeaders: ["Authorization"]
});
server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(rjwt(config.jwt).unless({
    path: ['/auth', '/user/insert', '/']
}));

server.get('/user', (req, res, next) => {
    res.send(req.user);
});

server.post('/auth', (req, res, next) => {
    //console.log("Req Body",req.body);
    let data = req.body;
    console.log(typeof data);
    let email = data.email;
    let password = data.password;

    user.authenticate(email, password).then(data => {
        let token = jwt.sign(data, config.jwt.secret, {
            expiresIn: '100m'
        });

        let {iat, exp} = jwt.decode(token);
        res.send({iat, exp, token});
    }).catch(err => {
        res.send({
            statusCode: '404',
            status: 'User Not Found'
        })
    })
});

server.post('/user/insert', (req, res, next) => {
    const {
        email,
        password,
        firstName,
        lastName,
    } = req.body;

    console.error(email);
    user.insert({
        email,
        password,
        firstName,
        lastName
    }).then(() => {
        res.send({
            'statusCode': '200',
            'status': 'User Inserted'
        });
    })
});

server.post('/todo/add', (req, res, next) => {
    let {_id} = req.user;
    let {todo} = req.body;
    todos.insertTodo(_id, todo).then((data) => {
        res.send({
            'statusCode': '200',
            'status': 'Todo Added ',
            'id': data.id
        });
    });
    next();
});

server.post('/todo/delete', (req, res, next) => {
    let {_id} = req.user;
    let {todoID} = req.body;
    todos.deleteTodo(_id, todoID).then((data) => {
        res.send({
            'statusCode': '200',
            'status': 'Todo Deleted '
        });
    });
    next();
});

server.post('/todo/list', (req, res, next) => {
    let {_id} = req.user;
    todos.listTodos(_id).then((data) => {
        res.send(data);
    });
    next();
});

server.post('/todo/share', (req, res, next) => {
    let {_id} = req.user;
    let todoID = req.hasOwnProperty('body') && req.body.hasOwnProperty('todoID') ? req.body.todoID : '';
    let toUserEmail = req.hasOwnProperty('body') && req.body.hasOwnProperty('toUserEmail') ? req.body.toUserEmail : '';

    if(todoID!=="" && toUserEmail!==""){
        user.findUserID(toUserEmail)
            .then((response) => {
                if(response){
                    todos.shareTo(_id, response._id, todoID).then((data) => {
                        console.log('shared',data);
                        res.send(data);
                        next();
                    });
                }else{
                    res.send({
                        'statusCode': '404',
                        'status': 'User Not Found'
                    });
                    next();
                }

            }).catch((err) => {
                console.log(err);
            });
    }else{
        console.log("No todoID Specified");
        res.send("No todoID Specified");
        next();
    }

});

server.post('/todo/updateStatus', (req, res, next) => {
    let {_id} = req.user;
    let todoID = req.hasOwnProperty('body') && req.body.hasOwnProperty('todoID')? req.body.todoID : '';
    let todoStatus = req.hasOwnProperty('body') && req.body.hasOwnProperty('todoStatus')? req.body.todoStatus : false;

    console.log(todoID,todoStatus);
    if(todoID!==""){
        todos.updateStatus(_id,todoID,todoStatus).then((data) => {
            res.send(data);
        });
    }
    next();
});

server.post('/todo/updateContent', (req, res, next) => {
    let {_id} = req.user;
    let todoID = req.hasOwnProperty('body') && req.body.hasOwnProperty('todoID')? req.body.todoID : '';
    let todoContent = req.hasOwnProperty('body') && req.body.hasOwnProperty('todoContent')? req.body.todoContent : false;

    console.log(todoID,todoContent);
    if(todoID!==""){
        todos.updateTodo(_id,todoID,todoContent).then((data) => {
            res.send(data);
        });
    }
    next();
});

server.get('/', (req, res, next) => {
    res.send('A Monster Lives Here, Run Away');
    next();
});

dbUtil.connect()
    .then(() => {
        console.log("Database Connected");
    })
    .then(() => {
        console.log("Booting Server");
        server.listen(process.env.PORT || 3000, function () {
            console.log('%s listening at %s', server.name, server.url);
        });
    })
    .catch(err => {
        console.error(err);
    });
