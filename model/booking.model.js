const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema.Types;
const bookingSchema = mongoose.Schema({
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
    pickupid:{
        type:ObjectId,
        required:true
    },
    dropoffid:{
        type:ObjectId,
        required:true
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
    pnr: {
        type: String,
        required: true
    },
    seats: {
        type: Array,
        required: true
    },
    userid: {
        type: String,
        required: true
    },
    tripId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: "Confirmed"
    },
    bookedfrom: {
        type: String,
        default: "Airpax",
        enum: ["Airpax", "Gmr"], // Replace with your allowed values
    },
    CreatedAt: { type: Date, default: Date.now },
});
const BookingModel = mongoose.model("Booking", bookingSchema)
module.exports = { BookingModel };