/**
 * Created by tianhuaren on 3/17/15.
 */
var setting = require('setting');
var webworkerthreads = require('webworker-threads');
function dowork(func,data) {
	var threads_number = setting.threads_number;
    var threadPool = webworkerthreads.createPool(threads_number).all.eval(func);
    threadPool.all.eval('', function(){
        func(data);
    });
};

exports.dowork = dowork;
