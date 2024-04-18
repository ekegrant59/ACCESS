const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const adminSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    password: String
})

module.exports = mongoose.model('admin', adminSchema)