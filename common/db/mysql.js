var mysql = require('mysql');
var queues = require('mysql-queues');
var settting = require('../../setting');

var getConnection = function(dbconfig) {

	// var connection = mysql.createConnection(dbconfig);
	// connection.connect(function(err) {
	// 	if (err) {
	// 		console.error('error connecting: ' + err.stack);
	// 		return;
	// 	}
	// });
	// return connection;


	var pool  = mysql.createPool(dbconfig);
	// pool.getConnection(function(err, connection) {
 //      if (err) {
	// 		console.error('error connecting: ' + err.stack);
	// 		return;
	// 	}
 //    });
	return pool;
};

exports.query = function() {
	var arg = arguments;
	var conn = new getConnection(settting.db.mysql.sr); //mysql.createPool(settting.db.mysql.sr); //
	conn.query(arguments[0], arg.length === 3 ? arguments[1] : null, function(err, result) {
		if (arg[arg.length - 1]) {
			arg[arg.length - 1](err, result);
		}
	});
};

exports.spquery = function() {
	var arg = arguments;
	var conn = new getConnection(settting.db.mysql.sp);
	conn.query(arguments[0], arg.length === 3 ? arguments[1] : null, function(err, result) {
		if (arg[arg.length - 1]) {
			arg[arg.length - 1](err, result);
		}
	});
};