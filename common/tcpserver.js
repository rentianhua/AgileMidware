var tcp = require("tcp.io");
var daoschedule = require('../dao/daoschedule');
var schedule = require("node-schedule");
var jobrule = require('../common/schedulerule');
var Req = require('../common/req');
var uuid = require('uuid');
var setting = require('../setting');
var log4js = require('../common/log4js');
/**
 * load
 *
 */
exports.start = function() {
	log4js.logger.info("Job TcpServer Started ...");
	console.log("Job TcpServer Started ...");
	var server = new tcp.server();
	server.on(function(socket) {
		socket.on(function(data) {
			log4js.logger.info("Server Request:%s", data);
			console.log("Server Request:%s", data);
			var model = JSON.parse(data);
			switch (model.parameter.toLowerCase()) {
				case "loadjob":
					Schedule.loadJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "insertjob":
					Schedule.insertJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "canceljob":
					Schedule.cancelJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "updatejob":
					Schedule.updateJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "handrunjob":
					Schedule.handRunJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "restartjob":
					Schedule.restartJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "getalljob":
					Schedule.getAlljob(function(data) {
						socket.emit(data);
					});
					break;
				case "deletejob":
					Schedule.deleteJob(model, function(data) {
						socket.emit(data);
					});
					break;
				case "getajob":
					Schedule.getJobById(model, function(data) {
						socket.emit(data);
					});
					break;
				default:
					socket.emit("{code:'7001',content:'未找到请求类型'}");
					break;
			}
		})
	});
	server.listen(setting.tcpport, setting.tcpip);
}

var Schedule = {
	/**
	 * 加载数据库调度进入队列
	 */
	loadJob: function(req, cb) {
		daoschedule.getAllJobs("qwqw", function(err, result) {
			console.log("加载数据库调度进入队列...");
			if (err) {
				log4js.logger.error("数据获取异常");　
			}
			if (result.length == 0) {
				cb("{code: '7001',content: '调度数据为空'}");
			} else {
				var replyjobdate = result;
				for (var key in replyjobdate) {
					var jobdate = replyjobdate[key];
					var rule = new schedule.RecurrenceRule();
					var datetype = jobdate.datetype.toLowerCase();
					var rule = jobrule.rule(datetype, jobdate.worktime);
					var x = jobdate;
					var j = schedule.scheduleJob(key, rule, function(taskdata) {　
						daoschedule.runLog(key, taskdata, "2", new Date(), 1, function(err, result) {});
						Req.BulidReq(taskdata, function(err, req) {
							if (err) {
								log4js.logger.error(err);
							} else {
								log4js.logger.info(req.body);　
							}
						});　
					}.bind(null, x));
				}
				cb("{code: '7001',content: 'load queue success'}");
			}
		});
	},

	/**
	 * 添加任务
	 *
	 */
	insertJob: function(req, cb) {

		log4js.logger.info(req);　
		var name = req.name;
		var mesg = "";
		if (req.name === null) {
			mesg += "name is null;";
		} else if (req.datetype === null) {
			mesg += "datetype is null;";
		} else if (req.state === null) {
			mesg += "state is null;";
		} else if (req.type === null) {
			mesg += "type is null;";
		} else if (req.url === null) {
			mesg += "url is null;";
		} else if (req.worktime === null) {
			mesg += "worktime is null;";
		}
		if (mesg != "") {
			cb("{code: '7003',content: '" + mesg + "'}");
		} else {
			daoschedule.searchJob(name, function(err, result) {
				if (err) {
					log4js.logger.error(err);　
				}
				if (result.length === 0) {
					if (req.innerid === null) {
						req.innerid = uuid.v1();
					}
					daoschedule.addJob(req, function(err, result) {
						if (err) {
							log4js.logger.error(err);　
						}
						if (req.state = "1") {
							// 加入任务队列
							var jobdate = req;
							var datetype = jobdate.datetype.toLowerCase();
							var rule = jobrule.rule(datetype, jobdate.worktime);
							var x = jobdate;
							var j = schedule.scheduleJob(req.innerid, rule, function(taskdata) {　
								// 为什么要取消任务呢  因为year是单次性任务 用完就取消掉 没必要放在队列里面浪费资源
								if (datetype === "year") {
									schedule.cancelJob(req.innerid);
								}
								daoschedule.runLog(req.innerid, taskdata, "2", new Date(), 1, function(err, result) {});
								Req.BulidReq(taskdata, function(err, req) {
									if (err) {
										log4js.logger.error(err);
									} else {
										log4js.logger.info(req.body);　
									}
								});
							}.bind(null, x));
						}
						cb("{code: '7001',content: 'add success'}");
					});

				} else {
					cb("{code: '7002',content: 'Task name repeat'}");
				}
			});
		}
	},

	/**
	 * 取消任务
	 *
	 *
	 */
	cancelJob: function(req, cb) {
		log4js.logger.info("开始取消任务" + req.jobid);　
		var jobid = req.jobid;
		daoschedule.getJobById(jobid, function(err, result) {
			if (result.length > 0) {
				daoschedule.updateJobState("2", jobid, function(err, result) {
					if (err) {
						log4js.logger.error(err);　
					}
					// 取消任务优先
					if (schedule.scheduledJobs[jobid]) {
						var mesg = schedule.cancelJob(jobid);
						cb("{code: '7001',content: '" + mesg + "'}");
					} else {
						cb("{code: '7005',content: 'job not found in queue'}");
					}
				});
			} else {
				cb("{code: '7004',content: 'job not found'}");
			}
		});
	},

	/**
	 * 更新任务
	 */
	updateJob: function(req, cb) {
		var jobid = req.jobid;
		var model = req;
		var mesg = "";
		if (req.datetype === null) {
			mesg += "datetype is null;";
		} else if (req.state === null) {
			mesg += "state is null;";
		} else if (req.type === null) {
			mesg += "type is null;";
		} else if (req.url === null) {
			mesg += "url is null;";
		} else if (req.worktime === null) {
			mesg += "worktime is null;";
		}
		if (mesg != "") {
			cb("{code: '7003',content: '" + mesg + "'}");
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
							var rule = new schedule.RecurrenceRule();
							var datetype = jobdate.datetype.toLowerCase();
							var worktime = jobdate.worktime;
							var rule = jobrule.rule(datetype, worktime);
							var x = jobdate;
							var j = schedule.scheduleJob(jobid, rule, function(taskdata) {　
								if (datetype === "year") {
									schedule.cancelJob(jobid);
								}
								// 执行了就记个log
								daoschedule.runLog(jobid, taskdata, "2", new Date(), 1, function(err, result) {});
								Req.BulidReq(taskdata, function(err, req) {
									if (err) {
										log4js.logger.error(err);
									} else {
										log4js.logger.info("调用状况"+req.statusCode + req.body);　
									}
								});　
							}.bind(null, x));
						} else {
							// 如果队列中含有这个任务才能停掉
							if (schedule.scheduledJobs[jobid]) {
								var result = schedule.cancelJob(jobid);
							}
						}
						cb("{code: '7001',content: 'update success'}");
					});

				} else {
					cb("{code: '7004',content: 'job not found'}");
				}
			});
		}
	},

	/**
	 *手动运行job
	 *
	 */
	handRunJob: function(req, cb) {
		var jobid = req.jobid;
		daoschedule.getJobById(jobid, function(err, result) {
			if (err) {
				log4js.logger.error(req);　
			}
			var replyjobdate = result;
			if (result.length == 0) {
				cb("{code: '7004',content: 'job not found'}");
			} else {
				var jobdate = replyjobdate[0];
				var rule = new schedule.RecurrenceRule();
				var datetype = jobdate.datetype.toLowerCase();
				var worktime = new Date();
				var rule = jobrule.rule("year", worktime);
				var x = jobdate;
				var newjobid = uuid.v1();
				// 手动完成过后就把他取消掉
				var j = schedule.scheduleJob(newjobid, rule, function(taskdata) {　
					//取消任务 减少调度里面任务个数
					schedule.cancelJob(newjobid);
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
				}.bind(null, x));
				cb("{code: '7001',content: 'hand run success'}");
			}

		});
	},

	/**
	 * 重启任务
	 *
	 */
	restartJob: function(req, cb) {
		var jobid = req.jobid;
		daoschedule.getJobById(jobid, function(err, result1) {
			if (result1.length > 0) {
				daoschedule.updateJobState("1", jobid, function(err, result) {
					if (err) {
						log4js.logger.error(err);　
					}
					var jobdate = result1[0];
					var rule = new schedule.RecurrenceRule();
					var datetype = jobdate.datetype.toLowerCase();
					var worktime = jobdate.worktime;
					var rule = jobrule.rule(datetype, worktime);
					var x = jobdate;
					var j = schedule.scheduleJob(jobid, rule, function(taskdata) {　
						if (datetype === "year") {
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
					}.bind(null, x));
					cb("{code: '7001',content: 'restart success'}");
				});
			} else {
				cb("{code: '7004',content: 'job not found'}");
			}
		});
	},

	/**
	 * 获取所有在队列的任务
	 *
	 */
	getAlljob: function(cb) {
		var all_jobs = schedule.scheduledJobs;
		log4js.logger.info("获取所有在队列的任务:" + JSON.stringify(all_jobs));
		console.log("{code: '7001',content: '" + JSON.stringify(all_jobs) + "'}");
		cb("{code: '7001',content: '" + JSON.stringify(all_jobs) + "'}");
	},

	/**
	 * 删除任务
	 */
	deleteJob: function(req, cb) {

		daoschedule.getJobById(req.innerid, function(err, result1) {
			if (result1.length > 0) {
				if (schedule.scheduledJobs[req.innerid]) {
					var result = schedule.cancelJob(req.innerid);
				}
				// 删除任务
				daoschedule.deleteJob(req, function(err, date) {
					cb("{code: '7001',content: 'delete success'}");
				})
			} else {
				cb("{code: '7004',content: 'job not found'}");
			}
		})
	},

	/**
	 *  获取单个job
	 */
	getJobById: function(req, cb) {
		daoschedule.getJobById(req.innerid, function(err, result1) {

			if (result1.length > 0) {
				var newjson = {
					code: "7001",
					content: JSON.stringify(result1[0])
				}
				console.log(JSON.stringify(newjson));
				cb(JSON.stringify(newjson));
			} else {
				var newjson = {
					code: "7004",
					content: "no job"
				}
				console.log(JSON.stringify(newjson));
				cb(JSON.stringify(newjson));
			}

		});
	}
}
