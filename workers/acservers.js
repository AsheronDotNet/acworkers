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

                var loginPacketHex = '"00 00 00 00 00 00 01 00 93 00 d0 05 00 00 00 00 40 00 00 00 04 00 31 38 30 32 00 00 34 00 00 00 01 00 00 00 00 00 00 00 3e b8 a8 58 1c 00 61 63 73 65 72 76 65 72 74 72 61 63 6b 65 72 3a 6a 6a 39 68 32 36 68 63 73 67 67 63 00 00 00 00 00 00 00 00 00 00"';

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
