const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const SubseatSchema = new Schema({
    fname: { type: String },
    lname: { type: String },
    age: { type: Number },
    gender: { type: String },
    seatNo: { type: String },
    status: { type: String, default: "Pending" },
    amount: { type: Number },
    mobileno: { type: Number },
    email: { type: String },
    refundAmount: { type: Number },
    cancellationReason: { type: String },
    onboarded:Boolean,
    foodaccepted:Boolean,
    food: [
        {
            name: {
                type: String
            },
            price: {
                type: Number
            },
            quantity: {
                type: Number
            }
        }

    ]
})

const seatSchema = mongoose.Schema({
    seatNumber: { type: String, required: true },
    isBooked: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    expireAt: {
        type: Date,
        default: null, // This will be populated only if `shouldExpire` is true
        index: { expires: '0' } // TTL index based on this field; expires if not null
    },
    pnr: String,
    totalamount: Number,
    platform: String,
    tripId: {
        type: String,
        required: true
    },
    bookedby: {
        type: String,
        required: true
    },
    details: SubseatSchema,
    CreatedAt: { type: Date, default: Date.now },
});
const SeatModel = mongoose.model("Seats", seatSchema)
module.exports = { SeatModel };