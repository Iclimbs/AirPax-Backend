const mongoose = require("mongoose");



const foodDetails = new mongoose.Schema({
    foodName: {
        type: String,
        required: true
    },
    foodConsumption: {
        type: Number,
        required: true
    },
    pricePerFood: {
        type: Number
    }
})

const SuperviorReportSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Types.ObjectId,
        ref: "Trips",
        required: true
    },
    totalPassengers: {
        type: Number,
        required: true,
    },
    onboardingPassengers: {
        type: Number,
        required: true
    },
    fuelConsuptioninLiter: {
        type: Number,
        required: true
    },
    fuelPricePerLiter: {
        type: Number,
        required: true
    },
    others: {
        type: String
    },
    food: [foodDetails]
}, { timestamps: true })

const SuperviorReport = mongoose.model("SuperviorReport", SuperviorReportSchema)
module.exports = { SuperviorReport }