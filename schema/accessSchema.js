const mongoose = require('mongoose')
const mongodb = process.env.MONGODB
mongoose.connect(mongodb)

const accessSchema = new mongoose.Schema({
    profile: { type: mongoose.Schema.Types.ObjectId, ref: 'profile', required: true },
    status: String,
    logged: String,
    card: String,
    date: String
})

module.exports = mongoose.model('access', accessSchema)