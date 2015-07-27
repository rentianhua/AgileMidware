
var amqp = require('amqp');
var setting = require('../setting');
var mysql = require('../common/db/mysql');
var Req = require('../common/req');
/**
 * rabbitmq封装
 */

//生成持久化MQ队列监听并转发到相应接口
exports.init_queue = function (queuedata) {
    //console.log(queuedata);
    var connection = amqp.createConnection(setting.srmq,
        {
            defaultExchangeName: 'amq.topic'
            //, reconnect: false
            // , reconnectBackoffStrategy: 'linear'
            // , reconnectExponentialLimit: 120000
            // , reconnectBackoffTime: 1000
        });
    connection.on('ready', function () {
        connection.queue(queuedata.queue, {
            durable: true,
            autoDelete: false,
            exclusive: false,
            passive: false
        }, function (queue) {
            if (queuedata.bind === undefined)
                queue.bind('#');
            else
                queue.bind(queuedata.bind, queuedata.routekey);

            queue.subscribe({ack: true}, function (message, headers, deliveryInfo, ack) {
                var bodyData = unescape(message.data);
                console.log(1);
                //log4js.logger.info(bodyData);
                var endpoint = queuedata.endpoint;
                //获取Json内容
                try {
                    var d = JSON.parse(bodyData.replace(/\r/g, '').replace(/\n/g, ''));
                    if (d.invoke != null && d.invoke != undefined) {
                        endpoint = d.invoke;
                    };
                    console.log(d);
                }
                catch (error) {
                    ack.acknowledge();
                    log4js.logger.info("json parse error start");
                    log4js.logger.info(error);
                    log4js.logger.info("json parse error end");
                };

                //转发消息到指定接口
                try {
                    if(queuedata.iswait)
                    {
                        Req.callapi2(queuedata.host, endpoint,d,function(){ack.acknowledge();});
                    }else
                    {
                        Req.callapi(queuedata.host, endpoint,d);
                        ack.acknowledge();
                    }
                } catch (error) {
                    
                    log4js.logger.info("json parse error start");
                    log4js.logger.info(error);
                    log4js.logger.info("json parse error end");
                    ack.acknowledge();
                };
            })
        });
    });
    connection.on('error', function (e) {
        //console.log(e);
        //connection.disconnect();
    });
};

//生成临时MQ队列监听并转发到相应接口
exports.init_temp_queue = function (queuedata) {
    var connection = amqp.createConnection(setting.srmq,
        {
            defaultExchangeName: 'amq.topic'
            , reconnect: false
            // , reconnectBackoffStrategy: 'linear'
            // , reconnectExponentialLimit: 120000
            // , reconnectBackoffTime: 1000
        });
    connection.on('ready', function () {
        connection.queue(queuedata.queue, {
            durable: true,
            autoDelete: true,
            exclusive: false,
            passive: false
        }, function (queue) {
            if (queuedata.bind === undefined)
                queue.bind('#');
            else
                queue.bind(queuedata.bind, queuedata.routekey);

            queue.subscribe({ack: true}, function (message, headers, deliveryInfo, ack) {
                var bodyData = unescape(message.data);
                var endpoint = queuedata.endpoint;
                var d = JSON.parse(bodyData.replace(/\r/g, '').replace(/\n/g, ''));
                if (d.invoke != null && d.invoke != undefined) {
                    endpoint = d.invoke;
                }
                //ack.acknowledge();
                try {
                    Req.callapi(queuedata.host, endpoint,d);
                    ack.acknowledge();
                } catch (e) {
                    ack.acknowledge();
                }
                ;
            })
        });
    });
    connection.on('error', function (e) {
        //console.log(e);
        //connection.disconnect();
    });
};

//生成队列并插入数据
exports.push_queue = function (queuedata, data, autoDelete) {
    var connection = amqp.createConnection(setting.srmq);
    connection.on('ready', function () {
        connection.queue(queuedata.queue, {
            durable: true,
            autoDelete: autoDelete,
            exclusive: false,
            passive: false
        }, function (queue) {
            console.log(1);
            console.log(queuedata.queue);
            connection.publish(queuedata.queue, JSON.stringify(data), null, function (c) {
                console.log(2);
            });
        })
    });
};

//监听带有protobuf格式的数据
exports.init_queue_protobuf = function (queuedata) {
    var connection = amqp.createConnection(setting.spmq,
        {
            defaultExchangeName: 'amq.topic'
            , reconnect: false
            // , reconnectBackoffStrategy: 'linear'
            // , reconnectExponentialLimit: 120000
            // , reconnectBackoffTime: 1000
        });
    connection.on('ready', function () {
        connection.queue(queuedata.queue, {
            durable: true,
            autoDelete: false,
            exclusive: false,
            passive: false
        }, function (queue) {
            if (queuedata.bind === undefined)
                queue.bind('#');
            else
                queue.bind(queuedata.bind, queuedata.routekey);
            queue.subscribe({ack: true}, function (message, headers, deliveryInfo, ack) {
                var msg = {};
                //console.log(d);
                //console.log(d.body);
                try {
                    if(queuedata.isproto) {
                        // var ProtoBuf = require("protobufjs");
                        // var builder = ProtoBuf.protoFromFile("proto_sp.proto");
                        // var Message = builder.build("sp.CustomerInformation");
                        // msg = Message.decode(message.data);
                        ack.acknowledge();
                    } else {
                        var bodyData = unescape(message.data);
                        msg = JSON.parse(bodyData.replace(/\r/g, '').replace(/\n/g, ''));
                        //重数据库中取accountid
                        mysql.spquery("SELECT `config` FROM `cf_account` WHERE innerid = '{0}';".format(msg.body.request.account_id),function(err, data){
                            var accountid = eval('(' + data[0].config + ')').accountid;
                            //没有target就不发送
                            if(msg.body.request.target.length){
                                if(msg.msgid=='cf.send.wechat') {
                                    //获取openID
                                    mysql.qcquery("SELECT openid FROM sr_cust_channel_wechat WHERE accountid='{0}' AND custid='{1}';".format(accountid,msg.body.request.target[0]||''),function(err, data){
                                        var openid = data.length ? data[0].openid : null;
                                        if(openid){
                                            Req.callapi(queuedata.host, '/socialapi/wechatapi/sendtext',{
                                                "content": msg.body.request.content,
                                                "account": accountid,
                                                "openid": [
                                                    openid
                                                ],
                                                "paramex": ""
                                            });
                                        }
                                    });
                                } else  if (msg.msgid=='cf.send.sms') {
                                    if(msg.body.request.target.length){
                                        Req.callapi(queuedata.host, '/socialapi/smsapi/sendsms', {
                                            "tenantid":"1",
                                            "sendaccount":accountid,
                                            "receiver": msg.body.request.target[0],
                                            "content": msg.body.request.content,
                                            "paramEx":""
                                        });
                                    }
                                }
                            }
                        });
                        ack.acknowledge();
                    }
                    //转发消息到指定接口
                    //$.httpapipost.callapi(queuedata.host, queuedata.endpoint,msg);
                } catch (e) {
                    console.log(e);
                    ack.acknowledge();
                }
            })
        });
    });
    connection.on('error', function (e) {
        //console.log(e);
        //connection.disconnect();
    });
};