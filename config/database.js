// config/database.js

module.exports = {
    url: 'mongodb://' + process.env.API_DB_USER + ':' + process.env.API_DB_PASS + '@' + process.env.API_DB_HOST + ':' + process.env.API_DB_PORT + '/' + process.env.API_DB_NAME
};
