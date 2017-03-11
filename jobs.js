var fs = require('fs');
var schedule = require('node-schedule');

var workers = {};
var jobs = [];

fs.readdirSync('./workers/').forEach(file => {
    workers[file.slice(0,-3)] = require('./workers/' + file)(schedule);
});

jobs.push(schedule.scheduleJob('* * * * *', function() {
    workers['reddit'].run();
}));

jobs.push(schedule.scheduleJob('*/5 * * * *', function() {
    workers['acservers'].run();
}));

jobs.push(schedule.scheduleJob('* */1 * * *', function() {
    workers['serverlist'].run();
}));
