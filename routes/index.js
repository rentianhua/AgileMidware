var schedule = require("node-schedule");
var Req = require('../common/req');
var pubmeth = require('../common/pubmeth');
var uuid = require('uuid');
var jobrule = require('../common/schedulerule');
var log4js = require('../common/log4js');
var daoschedule = require('../dao/daoschedule');

exports.autoroute = {
	get: {
		'/': index,
		'/redis': redistest,
		'/getalljob': getAlljob,
		'/redistest': redistest
	},
	post: {
		'/insertjob': insertJob,
		'/handrunjob': handRunJob,
		'/canceljob': cancelJob,
		'/restartjob': restartJob,
		'/updatejob': updateJob,
		'/deletejob': deleteJob,
	}
};

/**
 * 添加任务
 *
 */
function insertJob(req, res) {

	log4js.logger.info(req.body);　
	var name = req.body.name;
	var mesg = "";
	if (req.body.name === null) {
		mesg += "name is null;";
	} else if (req.body.datetype === null) {
		mesg += "datetype is null;";
	} else if (req.body.state === null) {
		mesg += "state is null;";
	} else if (req.body.type === null) {
		mesg += "type is null;";
	} else if (req.body.url === null) {
		mesg += "url is null;";
	} else if (req.body.worktime === null) {
		mesg += "worktime is null;";
	}
	if (mesg != "") {
		res.send("{code: '7003',content: '" + mesg + "'}");
	} else {
		daoschedule.searchJob(name, function(err, result) {
			if (err) {
				log4js.logger.error(err);　
			}
			if (result.length === 0) {
				if (req.body.innerid === null) {
					req.body.innerid = uuid.v1();
				}
				daoschedule.addJob(req.body, function(err, result) {
					if (err) {
						log4js.logger.error(err);　
					}
					if (req.body.state = "1") {
						// 加入任务队列
						var jobdate = req.body;
						(function(jobdate) {
							var rule = jobrule.rule(jobdate.datetype.toLowerCase(), jobdate.worktime);
							schedule.scheduleJob(req.body.innerid, rule, function(taskdata) {　
								// 为什么要取消任务呢  因为year是单次性任务 用完就取消掉 没必要放在队列里面浪费资源
								if (jobdate.datetype.toLowerCase() === "year") {
									schedule.cancelJob(req.body.innerid);
								}
								daoschedule.runLog(req.body.innerid, taskdata, "2", new Date(), 1, function(err, result) {});
								Req.BulidReq(taskdata, function(err, req) {
									if (err) {
										log4js.logger.error(err);
									} else {
										log4js.logger.info(req.body);　
									}
								});
							}.bind(null, jobdate));
						})(jobdate);
					}
					res.send("{code: '7001',content: 'add success'}");
				});

			} else {
				res.send("{code: '7002',content: 'Task name repeat'}");
			}
		});
	}
};

/**
 * 数据初始化
 *
 */
function index(req, res) {
	// 如果调度真在工作那么刷新 无效
	if (Object.keys(schedule.scheduledJobs).length) {
		res.render('index', {
			name: 'Smartac Schedule Service',
			info: 'working...'
		});
	} else {
		res.render('index', {
			name: 'Smartac Schedule Service',
			info: 'Error no job data load in the schedule'
		});
	}
}

function redistest(req, res) {
	console.log(111111111111);
	//var schedule = require('node-schedule');
	//var date = new (2015, month[5,6,7, day[ 2,3,8,9 ,hour[9, minutes[48, seconds[40]]]]]);
	var rule = new schedule.RecurrenceRule();
	// rule.month=[5,6,7];
	// rule.date = [0, new schedule.Range(4, 8)]
	// rule.hour = 10;
	 //rule.minute = 2;
	//rule.second = 120;
	
    // var next = rule.nextInvocationDate(base);
    // console.log(next);
    worktime = 2;
    var times = [];
		for (var i = 1; i < 60; i++) {
			if (i * worktime <= 60) {
				times.push(i * worktime != 60 ? i * worktime : 0);
			} else {
				break;
			}
		}
		rule.minute = times;
		console.log(times);
	var j = schedule.scheduleJob(rule, function() {
		console.log('The world is going to end today.');
	});
res.send("11212");
};

/*
 * 取消任务
 *
 *
 */
function cancelJob(req, res) {
	log4js.logger.info("开始取消任务" + req.body.jobid);　
	var jobid = req.body.jobid;
	daoschedule.getJobById(jobid, function(err, result) {
		if (result.length > 0) {
			daoschedule.updateJobState("2", jobid, function(err, result) {
				if (err) {
					log4js.logger.error(err);　
				}
				// 取消任务优先
				if (schedule.scheduledJobs[jobid]) {
					var mesg = schedule.cancelJob(jobid);
					res.send("{code: '7001',content: '" + mesg + "'}");
				} else {
					res.send("{code: '7005',content: 'job not found in queue'}");
				}
			});
		} else {
			res.send("{code: '7004',content: 'job not found'}");
		}
	});
};

/**
 *手动运行job
 *
 */
function handRunJob(req, res) {
	log4js.logger.info("手动运行job:" + req.body.jobid);
	var jobid = req.body.jobid;
	daoschedule.getJobById(jobid, function(err, result) {
		if (err) {
			log4js.logger.error(req);　
		}
		var replyjobdate = result;
		if (result.length == 0) {
			res.send("{code: '7004',content: 'job not found'}");
		} else {
			var jobdate = replyjobdate[0];
			var worktime = new Date();
			// 手动运行其实就是立刻运行就是取当前实时间
			var rule = jobrule.rule("year", worktime);
			var newjobid = uuid.v1();
			// 手动完成过后就把他取消掉
			schedule.scheduleJob(newjobid, rule, function(taskdata) {　
				//取消任务 减少调度里面任务个数
				if (schedule.scheduledJobs[newjobid]) {
					var result = schedule.cancelJob(newjobid);
					log4js.logger.info("手动运行job 后从队列中删除:" + result);
				}
				// 执行了就记个log
				daoschedule.runLog(jobid, taskdata, "1", worktime, 1, function(err, result) {});
				// 发送请求
				Req.BulidReq(taskdata, function(err, req) {
					if (err) {
						log4js.logger.error(err);
					} else {
						log4js.logger.info(req.body);　
					}
				});　
			}.bind(null, jobdate));
			res.send("{code: '7001',content: 'hand run success'}");
		}
	});
};

/**
 * 重启任务
 *
 */
function restartJob(req, res) {
	log4js.logger.info("重启任务");
	var jobid = req.body.jobid;
	daoschedule.getJobById(jobid, function(err, result1) {
		if (result1.length > 0) {
			daoschedule.updateJobState("1", jobid, function(err, result) {
				if (err) {
					log4js.logger.error(err);　
				}
				(function(result1) {
					var rule = jobrule.rule(result1[0].datetype.toLowerCase(), result1[0].worktime);
					schedule.scheduleJob(jobid, rule, function(taskdata) {　
						if (result1[0].datetype.toLowerCase() === "year") {
							schedule.cancelJob(jobid);
						}
						daoschedule.runLog(jobid, taskdata, "2", new Date(), 1, function(err, result) {});
						Req.BulidReq(taskdata, function(err, req) {
							if (err) {
								log4js.logger.error(err);
							} else {
								log4js.logger.info(req.body);　
							}
						});　
					}.bind(null, result1[0]));
				})(result1);
				res.send("{code: '7001',content: 'restart success'}");
			});
		} else {
			res.send("{code: '7004',content: 'job not found'}");
		}
	});
}

/**
 * 更新任务
 */
function updateJob(req, res) {
	log4js.logger.info("修改job数据");　
	log4js.logger.info(req.body);　
	var jobid = req.body.jobid;
	var model = req.body;
	var mesg = "";
	if (req.body.datetype === null) {
		mesg += "datetype is null;";
	} else if (req.body.state === null) {
		mesg += "state is null;";
	} else if (req.body.type === null) {
		mesg += "type is null;";
	} else if (req.body.url === null) {
		mesg += "url is null;";
	} else if (req.body.worktime === null) {
		mesg += "worktime is null;";
	}
	if (mesg != "") {
		res.send("{code: '7003',content: '" + mesg + "'}");
	} else {
		daoschedule.getJobById(jobid, function(err, result1) {
			if (result1.length > 0) {
				// 先取消任务
				daoschedule.updateJobMain(model, function(err, result) {
					if (err) {
						log4js.logger.error(err);　
					}
					//  如果任务正在运行 那么先取消掉  然后重新赋值
					if (model.state == "1") {
						// 如果队列中含有这个任务才能停掉
						if (schedule.scheduledJobs[jobid]) {
							var result = schedule.cancelJob(jobid);
						}
						var jobdate = model;
						var rule = jobrule.rule(jobdate.datetype.toLowerCase(), jobdate.worktime);
						schedule.scheduleJob(jobid, rule, function(taskdata) {　
							if (jobdate.datetype.toLowerCase() === "year") {
								schedule.cancelJob(jobid);
							}
							// 执行了就记个log
							daoschedule.runLog(jobid, taskdata, "2", new Date(), 1, function(err, result) {});
							Req.BulidReq(taskdata, function(err, req) {
								if (err) {
									log4js.logger.error(err);
								} else {
									log4js.logger.info("调用状况" + req.statusCode + req.body);　
								}
							});　
						}.bind(null, jobdate));
					} else {
						// 如果队列中含有这个任务才能停掉
						if (schedule.scheduledJobs[jobid]) {
							var result = schedule.cancelJob(jobid);
						}
					}
					res.send("{code: '7001',content: 'update success'}");
				});
			} else {
				res.send("{code: '7004',content: 'job not found'}");
			}
		});
	}
};
/**
 * 获取所有在队列的任务
 *
 */
function getAlljob(req, res) {
	var all_jobs = schedule.scheduledJobs;
	log4js.logger.info(all_jobs);
	res.send({
		code: "7001",
		date: {
			state: "1",
			content: all_jobs
		}
	});
};

function deleteJob(req, res) {
	log4js.logger.info("删除任务：" + req.body.innerid);
	daoschedule.getJobById(req.body.innerid, function(err, result1) {
		if (result1.length > 0) {
			if (schedule.scheduledJobs[req.body.innerid]) {
				var result = schedule.cancelJob(req.body.innerid);
			}
			// 删除任务
			daoschedule.deleteJob(req.body, function(err, date) {
				res.send("{code: '7001',content: 'delete success'}");
			})
		} else {
			res.send("{code: '7004',content: 'job not found'}");
		}
	})
};