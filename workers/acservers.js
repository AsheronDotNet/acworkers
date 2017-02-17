var request = require('request-promise');
var Promise = require('bluebird');
var exec = require('child_process').exec;

function promiseFromChildProcess(child) {
    return new Promise(function(resolve, reject) {
        child.stdout.on('data', resolve);
        child.stderr.on('data', reject);
    });
}

module.exports = function(schedule, cfg) {
    return {
        run: function() {

            var servers = request({
                uri: 'http://api.asheronsdb.com/servers',
                method: 'GET'
            });

            console.log()

            servers.then(results => {

                var results = JSON.parse(results);

                var serverQueries = [];

                var loginPacketHex = '"00 00 00 00 00 00 01 00 e1 a3 f1 08 00 00 00 00 34 00 00 00 04 00 31 38 30 32 00 00 28 00 00 00 01 00 00 00 00 00 00 00 c0 42 a4 58 11 00 75 73 65 72 6e 61 6d 65 3a 70 61 73 73 77 6f 72 64 00 00 00 00 00 00 00 00 00"';

                results.result.forEach(function(server) {

                    // Local path:
                    // /Applications/PacketSender.app/Contents/MacOS/PacketSender

                    var cmd = 'packetsender -uxw 500 ' + server.address + ' ' + server.port + ' ' + loginPacketHex;

                    var child = exec(cmd);
                    var childPromise = promiseFromChildProcess(child);

                    childPromise.then(status => {

                        console.log('STATUS RESPONSE: ');
                        console.log(status);
                        console.log('---------------------------------------');

                        var jsonPayload = {
                            api_key: cfg.acAPIKey
                        };

                        if (status.indexOf('Response') !== -1) {
                            jsonPayload.online = true;
                        } else {
                            jsonPayload.online = false;
                        }

                        console.log(server.name)
                        console.log(jsonPayload);

                        if (jsonPayload.online !== server.online) {
                            request({
                                uri: 'http://api.asheronsdb.com/servers/' + server.id,
                                method: 'PUT',
                                json: jsonPayload
                            });
                        }

                    });
                });
            });
        }
    };
}
