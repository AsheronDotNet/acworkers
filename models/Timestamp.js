var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    name: String,
    timestamp: Number
});

module.exports = mongoose.model('Timestamp', schema);
