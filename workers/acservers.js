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

module.exports = function(schedule) {
    return {
        run: function() {
            var servers = request({
                uri: 'http://api.asheron.net/servers',
                method: 'GET'
            });

            console.log()

            servers.then(results => {

                var results = JSON.parse(results);

                var serverQueries = [];

                var loginPacketHex = '';

                results.result.forEach(function(server) {

                    // Local path:
                    // /Applications/PacketSender.app/Contents/MacOS/PacketSender

                    var cmd = 'packetsender -uxw 500 ' + server.address + ' ' + server.port + ' ' + process.env.AC_LOGIN_PACKET;

                    var child = exec(cmd);
                    var childPromise = promiseFromChildProcess(child);

                    childPromise.then(status => {

                        console.log('STATUS RESPONSE: ');
                        console.log(status);
                        console.log('---------------------------------------');

                        var jsonPayload = {}

                        if (status.indexOf('Response') !== -1) {
                            jsonPayload.online = true;
                        } else {
                            jsonPayload.online = false;
                        }

                        console.log(server.name)
                        console.log(jsonPayload);

                        if (jsonPayload.online !== server.online) {
                            request({
                                uri: 'http://api.asheron.net/servers/' + server.id,
                                method: 'PUT',
                                json: jsonPayload,
                                headers: {
                                    'Authorization': 'Bearer ' + process.env.API_SECRET_TEMP
                                }
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
