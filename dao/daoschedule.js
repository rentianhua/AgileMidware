var uuid = require('uuid');
var mysql = require('../common/db/mysql');
var schedule = require("node-schedule");
/**
 *  调用日志
 *
 */
exports.runLog = function(jobid, jobdate, exectype, exectime, result, callback) {

	var model = {
		innerid: uuid.v1(),
		jobid: jobid,
		jobname: jobdate.name,
		result: result, //执行结果 1 表示 调用成功 2 表示 调用失败
		state: 1, // 工作状态 1：working 2：worked
		exectype: exectype, // 执行类型 1:手动运行 2:系统触发
		exectime: exectime, //执行时间 
		createdtime: new Date()
	}
	mysql.query("INSERT INTO sr_schedule_log SET ?", model, function(err, result) {
		if (err) {
			console.log(err);
			callback(err, result);
		} else if (jobdate.datetype == "year") {
			var sqlstr = "UPDATE sr_schedule_main SET state = '" + 3 + "' where innerid='" + jobid + "'";
			mysql.query(sqlstr, function(err, result) {
				// 从队列中删除任务
				if (schedule.scheduledJobs[jobid]) {
					var result = schedule.cancelJob(jobid);
				}
				callback(err, result);
			});
		} else {
			callback(err, result);
		}
	});
};


/**
 * 获取所有可用调度
 *
 */
exports.getAllJobs = function(req, callback) {
	mysql.query("SELECT innerid, name, datetype, state, type, url, worktime, data FROM sr_schedule_main WHERE state=1;", function(err, result) {
		var data = {};
		for (var i = 0; i < result.length; i++) {
			data[result[i].innerid] = result[i];
		}
		callback(err, data);
	});
};

/**
 *  通过名称判断计划任务是否存在
 *
 */
exports.searchJob = function(name, callback) {
	var sqlstr = "SELECT innerid FROM sr_schedule_main where name= '" + name + "'";
	mysql.query(sqlstr, function(err, result) {
		callback(err, result);
	});
}

/**
 * 添加新的计划任务
 *
 *
 */
exports.addJob = function(req, callback) {
	var model = {
		"innerid": req.innerid,
		"datetype": req.datetype,
		"name": req.name,
		"state": req.state,
		"type": req.type,
		"url": req.url,
		"worktime": req.worktime,
		"level": req.level,
		"data": req.data,
		"createdtime": new Date()
	}
	mysql.query("INSERT INTO sr_schedule_main SET ?", model, function(err, result) {
		callback(err, result);
	});
}

/**
 * 判断计划任务是否存在
 *
 */
exports.getJobById = function(innerid, callback) {
	var sqlstr = "SELECT innerid, name, datetype, state, type, url, worktime, data FROM sr_schedule_main where innerid='" + innerid + "'";
	console.log(sqlstr);
	mysql.query(sqlstr, function(err, result) {
		callback(err, result);
	});
}


/**
 * 修改计划任务状态
 *
 */
exports.updateJobState = function(state, innerid, callback) {
	var sqlstr = "UPDATE sr_schedule_main SET state = '" + state + "' where innerid='" + innerid + "'";
	mysql.query(sqlstr, function(err, result) {
		callback(err, result);
	});
}

/**
 * 修改计划任务信息
 */
exports.updateJobMain = function(req, callback) {
	var sqlstr = "UPDATE sr_schedule_main SET datetype ='" + req.datetype + "',state ='" + req.state + "',type ='" + req.type + "',url ='" + req.url + "',worktime ='" + req.worktime + "', data ='" + req.data + "' where innerid ='" + req.jobid + "';";
	mysql.query(sqlstr, function(err, result) {
		callback(err, result);
	});
}

/**
 * 修改 任务完成状态和log
 */
exports.updateMainAndLog = function(req, callback) {

	if (req.datetype == "year") {
		var sqlstr = "UPDATE sr_schedule_main SET state = '" + 3 + "' where innerid='" + req.innerid + "'";
		mysql.query(sqlstr, function(err, result) {
			callback(err, result);
		});
	}
}


/**
 * 删除任务
 *
 */
exports.deleteJob = function(req, callback) {

		var sqlstr = "Delete from sr_schedule_main where innerid ='" + req.innerid + "'";
		mysql.query(sqlstr, function(err, result) {
			callback(err, result);
		});
	}
	/**
	 * 获取任务
	 */