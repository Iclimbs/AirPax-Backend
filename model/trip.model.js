const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ConductorSchema = new Schema({
    LogIn: { type: String, default: "00:00" },
    LogOut: { type: String, default: "00:00" },
    fuel: { type: Number, default: 0 },
    fuelCost: { type: Number, default: 0 }
})

const DriverSchema = new Schema({
    LogIn: { type: String, default: "00:00" },
    LogOut: { type: String, default: "00:00" },
    fuel: { type: Number, default: 0 },
    maintenance: { type: Number, default: 0 }
})



const tripschema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        required: true,
    },
    journeystartdate: {
        type: String,
        required: true
    },
    journeyenddate: {
        type: String,
        required: true
    },
    busid: {
        type: String,
        required: true
    },
    starttime: {
        type: String,
        required: true
    }, endtime: {
        type: String,
        required: true
    },
    totaltime: {
        type: String,
        required: false
    },
    distance: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    totalseats: {
        type: Number,
        required: true
    },
    bookedseats: {
        type: Number,
        required: true
    },
    availableseats: {
        type: Number,
        required: true
    },
    seatsbooked: {
        type: Array
    },
    driver: {
        type: String
    },
    conductor: {
        type: String
    },
    facilities: {
        type: Array,
        default: []
    },
    foodavailability: {
        type: Boolean,
        default: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    cancelled: {
        type: Boolean,
        default: false
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    pickuppoints: [mongoose.Types.ObjectId],
    dropoffpoints: [mongoose.Types.ObjectId],
    conductordetails: ConductorSchema,
    driverdetails: DriverSchema,
    CreatedAt: { type: Date, default: Date.now },
});
const TripModel = mongoose.model("Trips", tripschema)
module.exports = { TripModel };