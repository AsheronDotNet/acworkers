var fs = require('fs');
var schedule = require('node-schedule');
var cfg = require('./config.js');

var workers = {};
var jobs = [];

fs.readdirSync('./workers/').forEach(file => {
    workers[file.slice(0,-3)] = require('./workers/' + file)(schedule, cfg);
});

console.log(workers);

jobs.push(schedule.scheduleJob('* * * * *', function() {
    workers['reddit'].run();
}));

jobs.push(schedule.scheduleJob('*/10 * * * *', function() {
    workers['acservers'].run();
}));

jobs.push(schedule.scheduleJob('* */1 * * *', function() {
    workers['serverlist'].run();
}));



console.log(jobs);
