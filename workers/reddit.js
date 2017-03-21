var Discord = require('discord.js');
var jsonfile = require('jsonfile');
var async = require('asyncawait/async');
var await = require('asyncawait/await');
var request = require('request-promise');
var _ = require('underscore');
const mongoose = require('mongoose');

var database = require('../config/database');
mongoose.connect(database.url);

const Timestamp = require('../models/Timestamp');

mongoose.connection.on('connected', function() {
    console.log('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error', function(err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function() {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    mongoose.connection.close(function() {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});

module.exports = function(schedule) {

    return {
        run: async(function() {

            var webhook = new Discord.WebhookClient(process.env.REDDIT_WEBHOOK_ID, process.env.REDDIT_WEBHOOK_TOKEN);
            //var timestamp = 'data/timestamp.json';

            var timestampID = process.env.REDDIT_TIMESTAMP_ID;

            var query = Timestamp.findById(timestampID);
            var results = await (query.exec());

            if (results) {

                var lastTimestamp = results.timestamp;

                console.log('STATUS: Reddit scheduled job fired')

                var subreddits = ['AsheronsCall', 'AC2'];
                var requests = [];

                subreddits.forEach(function(subreddit) {
                    requests.push(request({
                        uri: 'https://www.reddit.com/r/' + subreddit + '/new.json?sort=new',
                        method: 'GET'
                    }));
                });

                Promise.all(requests).then(subreddits => {

                    console.log('STATUS: All subreddits fetched');

                    var now = ((new Date).getTime() / 1000);

                    console.log(now, 'Now timestamp');
                    var newPosts = [];

                    subreddits.forEach(function(subreddit, index) {
                        var body = JSON.parse(subreddit);
                        body.data.children.forEach(function(child, index) {
                            if (child.data.created_utc > lastTimestamp) {
                                newPosts.push(child);
                            }
                        });
                    });

                    console.log(newPosts.length);

                    if (_.isEmpty(newPosts)) {
                        console.log('RESULT: No new posts found')
                        return false;
                    }

                    console.log('RESULT: Found new posts!')
                    var sortedPosts = _.sortBy(newPosts, function(post) {
                        return post.data.created_utc;
                    });

                    var postChunks = [];
                    var messagePromises = [];

                    while (sortedPosts.length) {
                        postChunks.push(sortedPosts.splice(0, 10));
                    }

                    postChunks.forEach(function(chunk) {

                        var slackMessage = {
                            "attachments": []
                        }

                        chunk.forEach(function(post) {
                            var attachment = {
                                'color': '#ff4500',
                                'author_name': 'New post on /r/' + post.data.subreddit,
                                "author_icon": "https://lh3.googleusercontent.com/J41hsV2swVteoeB8pDhqbQR3H83NrEBFv2q_kYdq1xp9vsI1Gz9A9pzjcwX_JrZpPGsa=w300",
                                'author_link': 'https://www.reddit.com/r/' + post.data.subreddit,
                                'pretext': 'https://redd.it/' + post.data.id,
                                'title': post.data.title,
                                'title_link': 'https://www.reddit.com' + post.data.permalink,
                                'fields': [],
                                'footer': 'Submitted by ' + post.data.author,
                                'ts': post.data.created_utc
                            }

                            if (post.data.selftext !== '') {
                                attachment.fields.push({
                                    'title': 'Preview',
                                    'value': post.data.selftext.substring(0, 450) + '...',
                                    'short': false
                                })
                            }

                            if (post.data.preview) {
                                attachment.image_url = post.data.preview.images[0].source.url;
                            }

                            slackMessage.attachments.push(attachment);

                        });

                        messagePromises.push(webhook.sendSlackMessage(slackMessage));

                    });

                    console.log(messagePromises);

                    Promise.all(messagePromises).then(messages => {

                        console.log('STATUS: All messages sent');



                        var query = Timestamp.findOneAndUpdate({
                            _id: timestampID
                        }, {
                            timestamp: now
                        }, {
                            upsert: true
                        });

                        var results = await (query.exec());

                        console.log(results);

                        //jsonfile.writeFileSync(timestamp, obj);

                    }).catch(function(e) {
                        console.log(e);
                    });
                }).catch(function(error) {

                    console.log('Could not fetch subreddit json')
                    console.log(error);

                });


            }


        })
    }



}
