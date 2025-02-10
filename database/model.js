const mongoose = require('mongoose');
const Users = mongoose.Schema({
    username: { type: String },
    password: { type: String },
    apikey: { type: String },
    defaultKey: { type: String },
    premium: { type: Array },
    limit: { type: Number },
    status: { type: String, default: 'active' } // Tambahkan kolom status
}, { versionKey: false });
module.exports.User = mongoose.model('api', Users);
