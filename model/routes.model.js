const mongoose = require('mongoose');

const RoutesSchema = mongoose.Schema({
    status: {
        type: Boolean,
        default: true
    },
    counter: {
        type: String,
        trim: true,
        required: true
    },
    time: {
        type: String,
        required: true,
        trim: true
    },
    purpose: {
        type: String,
        trim: true,
        required: true,
        enum: ['PickUp', 'DropOff']
    },
    location: {
        type: String,
        trim: true,
        required: true,
    },
    CreatedAt: { type: Date, default: Date.now },
},
)

const RoutesModel = mongoose.model('BusRoutes', RoutesSchema);

module.exports = { RoutesModel }