var log4js = require('log4js');
var path = require('path');
log4js.configure({
	appenders: [{
		type: 'console'
	}, {
		type: 'dateFile',
		filename: path.join(__dirname, '../logfile/access'),
		category: 'cheese',
		maxLogSize: 1024 * 1024,
		backup: 3,
        pattern: "-yyyy-MM-dd.log",
        alwaysIncludePattern: true,
	}]
});

module.exports.logger = log4js.getLogger('cheese');

// example

// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Gouda.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');
