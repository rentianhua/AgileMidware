
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var tcpserver = require('./common/tcpserver');
var setting = require('./setting');
var rabbitmq = require('./common/rabbitmq');
var log4js = require('./common/log4js');
var loadjob = require('./common/loadjob');

// npm i express-autoroute -t  安裝指令
var autoroute = require('express-autoroute');
var app = express();

// var db = require('./common/db');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 第三方插件
autoroute(app, {
  throwErrors: false,
  logger: require('winston'),
  routesDir: path.join(__dirname, 'routes') //'E:/nodejstest/nodejs-demo/routes'
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


// 加载所有的任务进入队列
//loadjob.load();

//tcpserver.start();

//sr MQ service
 var queues = setting.srmqsetting;
 for (var i = 0; i < queues.length; i++) {
     //$.webworker.dowork($.rabbitmq.init_queue,queues[i]);
     rabbitmq.init_queue(queues[i]);
 };
// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
