var request = require('request-promise');
var Promise = require('bluebird');
var exec = require('child_process').exec;

function promiseFromChildProcess(child) {
    return new Promise(function(resolve, reject) {
        child.stdout.on('data', resolve);
        child.stderr.on('data', reject);
    });
}

// Check server list
// https://raw.githubusercontent.com/cmoski/pac_launcher_config/master/servers_v2.xml

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

                var loginPacketHex = '"00 00 00 00 00 00 01 00 2e 96 3c 3c 00 00 00 00 44 00 00 00 04 00 31 38 30 32 00 00 38 00 00 00 01 00 00 00 00 00 00 00 29 13 a8 58 20 00 61 63 73 65 72 76 65 72 74 72 61 63 6b 65 72 3a 70 6d 78 6c 75 26 64 32 5e 39 6d 68 35 71 63 62 00 00 00 00 00 00 00 00 00 00"';

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
                            }).catch(function(error) {

                                console.log('Could not update server API')
                                console.log(error);

                            });
                        }

                    }).catch(function(error) {

                        console.log('Could not get server status over UDP')
                        console.log(error);

                    });
                });
            }).catch(function(error) {

                console.log('Could not fetch server list from API')
                console.log(error);

            });
        }
    };
}
