var request = require('request');
exports.BulidReq = function(obj, callback) {
	request[obj.type]({
			headers: {
				'content-type': 'application/json'
			},
			url: obj.url,
			body: obj.data != null ? obj.data.toString() : ""
		},
		function(err, req) {
			callback(err, req);
		}
	)
};

/**
 * Created by tianhuaren on 3/17/15.
 */
/**
 * rabbitmq封装
 */
exports.callapi = function (hosturl,endpoint,d) {
    request.post({
        headers: {'content-type': 'application/json'},
        url: 'http://' + hosturl + '/' + endpoint,
        body: JSON.stringify(d)
    }, function (error, response, body) {
        //console.log(body);
        log4js.logger.info("callapi:"+hosturl+endpoint);
        log4js.logger.info(error);
        log4js.logger.info("end callapi");
    });
}

exports.callapi2 = function (hosturl,endpoint,d,callback) {
    request.post({
        headers: {'content-type': 'application/json'},
        url: 'http://' + hosturl + '/' + endpoint,
        body: JSON.stringify(d)
    }, function (error, response, body) {
        //console.log(body);
        log4js.logger.info("callapi:"+hosturl+endpoint);
        log4js.logger.info(error);
        log4js.logger.info("end callapi");
        callback();
        //console.log(error);
    });
}