const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const profileSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    supervisor: String,
    location: String,
    created: String,
    expiry: String
})

module.exports = mongoose.model('profile', profileSchema)