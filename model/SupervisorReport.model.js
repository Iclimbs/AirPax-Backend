const mongoose = require("mongoose");

const foodDetails = new mongoose.Schema({
    foodName: {
        type: String,
        required: true
    },
    allocatedFood: {
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
    onboardedPassengers: {
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
    fuelTotalCost: {
        type: Number,
        required: true
    },
    currentReading: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    food: [foodDetails]
}, { timestamps: true })

const SuperviorReport = mongoose.model("SuperviorReport", SuperviorReportSchema)

const foodAllocateDetails = new mongoose.Schema({
    foodName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }
})
const FoodAllocationSchema = new mongoose.Schema({
    trip: {
        type: mongoose.Types.ObjectId,
        ref: "Trips",
        required: true
    },
    foodUnit: [foodAllocateDetails],
    allocatedFood: [foodAllocateDetails]
}, { timestamps: true })
const FoodAllocation = mongoose.model("FoodAllocation", FoodAllocationSchema)

module.exports = { SuperviorReport, FoodAllocation }