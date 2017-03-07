var Discord = require('discord.js');
var jsonfile = require('jsonfile');
var request = require('request-promise');
var _ = require('underscore');

module.exports = function(schedule, cfg) {

    return {
        run: function() {

            var webhook = new Discord.WebhookClient(process.env.REDDIT_WEBHOOK_ID, process.env.REDDIT_WEBHOOK_TOKEN);
            var timestamp = 'data/timestamp.json';

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
                var lastTimestamp = jsonfile.readFileSync(timestamp).timestamp;
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

                    var obj = {
                        timestamp: now
                    }

                    jsonfile.writeFileSync(timestamp, obj);

                    console.log('STATUS: Timestamp updated');

                }).catch(function(e) {
                    console.log(e);
                });
            }).catch(function(error) {

                console.log('Could not fetch subreddit json')
                console.log(error);

            });

        }
    }



}
