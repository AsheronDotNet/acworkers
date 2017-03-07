var Discord = require('discord.js');
var jsonfile = require('jsonfile');
var request = require('request-promise');
var _ = require('underscore');
var xml2js = require('xml2js');
var util = require('util');

// var parser = new xml2js.Parser({ explicitArray: false });
//
//
// var serverListURI = 'https://raw.githubusercontent.com/cmoski/pac_launcher_config/master/servers_v2.xml';
//
// var getServerList = request({
//     uri: serverListURI,
//     method: 'GET'
// })
//
// getServerList.then(function(response) {
//
//     parser.parseString(response, function(err, result) {
//
//         var servers = result['ArrayOfServerItem'].ServerItem;
//
//         servers.forEach(function(server) {
//
//         });
//
//         console.log()
//
//
//         console.log(util.inspect(result, false, null))
//         console.log('Done');
//
//
//     });
//
//
// }).catch(function(error) {
//     console.log('Couldn\'t fetch server list xml');
//     console.log(error);
// });
//
//


module.exports = function(schedule) {

    return {
        run: function() {

            // var serverListURI = 'https://raw.githubusercontent.com/cmoski/pac_launcher_config/master/servers_v2.xml';
            //
            // var getServerList = request({
            //     uri: serverListURI,
            //     method: 'GET'
            // })
            //
            // getServerList.then(function(response) {
            //
            //     console.log(response);
            //
            //
            // }).catch(function(error) {
            //     console.log('Couldn\'t fetch server list xml');
            //     console.log(error);
            // });



        }
    }



}
