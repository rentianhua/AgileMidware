var daoschedule = require('../dao/daoschedule');
var schedule = require("node-schedule");
var jobrule = require('./schedulerule');
var log4js = require('./log4js');
var Req = require('./req');

exports.load = function(){
	daoschedule.getAllJobs("qwqw", function(err, result0) {
			if (err) {
				log4js.logger.error(err);
			} else {
				var replyjobdate = result0;
				if (replyjobdate != null) {
					log4js.logger.info("系统初始化任务第一次加入队列");
					for (var key in replyjobdate) {
						(function(jobdate) {
							var rule = jobrule.rule(jobdate.datetype.toLowerCase(), jobdate.worktime);
							log4js.logger.info(jobdate.name + ":进入队列");
							schedule.scheduleJob(jobdate.innerid, rule, function(taskdata) {　
								if (jobdate.datetype.toLowerCase() === "year") {
									schedule.cancelJob(jobdate.innerid);
								}
								daoschedule.runLog(jobdate.innerid, taskdata, "2", new Date(), 1, function(err, result) {});
								Req.BulidReq(taskdata, function(err, req) {
									if (err) {
										log4js.logger.error(err);
									} else {
										log4js.logger.info(req.body);　
									}
								});　
							}.bind(null, jobdate));
						})(replyjobdate[key]);
					}
					log4js.logger.info("数据加载完毕");
				} else {
					log4js.logger.info("数据加载失败");
				}

			}
		});
}