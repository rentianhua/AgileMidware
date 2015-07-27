var schedule = require("node-schedule");

exports.rule = function(datetype, worktime) {

	var rule = new schedule.RecurrenceRule();
	// 定时时间规则
	if (datetype == "year") {
		var worktime = new Date(worktime);
		rule = worktime;
	} else if (datetype == "month") {
		//每年第几月的第几天 时间格式 [4,5]:[20,21]:17:47:12  月：天：时：分：秒
		var Arr = worktime.split(":");
		rule.date = parseInt(Arr[0]); //字符串转化为数组
		rule.hour = parseInt(Arr[1]);
		rule.minute = parseInt(Arr[2]);
		rule.second = parseInt(Arr[3]);
	} else if (datetype == "date") {
		//每个月的第几天 时间格式[1,2,3..31]:12:21:30  几号：时：分：秒
		var Arr = worktime.split(":");
		rule.date = parseInt(Arr[0]); //字符串转化为数组
		rule.hour = parseInt(Arr[1]);
		rule.minute = parseInt(Arr[2]);
		rule.second = parseInt(Arr[3]);
	} else if (datetype == "dayofweek") {
		// 每个星期的 星期几  时间格式 [0,1,2,3,4,5,6]:12:21:30 星期几：时：分：秒
		var Arr = worktime.split(":")
		var weeks = Arr[0].replace(/\[/, "").replace(/\]/, "").split(","); //字符串转化为数组
		rule.dayOfWeek = weeks.toArrayInt();
		rule.hour = parseInt(Arr[1]);
		rule.minute = parseInt(Arr[2]);
		rule.second = parseInt(Arr[3]);
	} else if (datetype == "hour") {
		//每天 时分秒 执行 时间格式 2:30:01  时：分：秒
		var Arr = worktime.split(":")
		rule.hour = parseInt(Arr[0]);
		rule.minute = parseInt(Arr[1]);
		rule.second = parseInt(Arr[2]);
	} else if (datetype == "minute") {
		//每小时里面的第几分钟 第几秒 执行 时间格式 01:12  分：秒
		var Arr = worktime.split(":")
		rule.minute = parseInt(Arr[0]);
		rule.second = parseInt(Arr[1]);
	} else if (datetype == "second") {
		//每分钟里面的第几秒执行  时间格式   2 每 两秒 执行
		var worktime = parseInt(worktime);
		var times = [];
		for (var i = 1; i < 60; i++) {
			if (i * worktime <= 60) {
				times.push(i * worktime != 60 ? i * worktime : 0);
			} else {
				break;
			}
		}
		rule.minute = times;
	}
	return rule;
}
