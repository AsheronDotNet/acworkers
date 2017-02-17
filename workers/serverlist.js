var Discord = require('discord.js');
var jsonfile = require('jsonfile');
var request = require('request-promise');
var _ = require('underscore');

module.exports = function(schedule, cfg) {

    return {
        run: function() {

            var serverListURI = 'https://raw.githubusercontent.com/cmoski/pac_launcher_config/master/servers_v2.xml';

            var getServerList = request({
                uri: serverListURI,
                method: 'GET'
            })

            getServerList.then(function() {


            }).catch(function(error){ 
                console.log('Couldn\'t fetch server list xml');
                console.log(error);
            });



        }
    }



}
