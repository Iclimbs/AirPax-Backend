const express = require("express");
const { default: mongoose } = require("mongoose");
const { SuperviorReport, FoodAllocation } = require("../model/SupervisorReport.model");
const { TripModel } = require("../model/trip.model");
const SupervisorRouter = express.Router();


SupervisorRouter.post("/submit-report", async (req, res) => {
    try {
        const { trip, totalPassengers, onboardingPassengers, fuelConsuptioninLiter, fuelPricePerLiter, others, food } = req?.body


        if (!trip) return res.send({ status: "error", message: "Trip Name Required!" })
        if (!mongoose.isValidObjectId(trip)) return res.send({ status: "error", message: "Invalid Trip Id!" })
        if (!totalPassengers) return res.send({ status: "error", message: "Total Passengers field Required!" })
        if (!onboardingPassengers) return res.send({ status: "error", message: "Onboarding Passengers field Required!" })
        if (!fuelConsuptioninLiter) return res.send({ status: "error", message: "Fuel ConsuptioninLiter field Required!" })
        if (!fuelPricePerLiter) return res.send({ status: "error", message: "Fuel Price Per Liter field Required!" })

        if (!Array.isArray(food)) return res.send({ status: "error", message: "Food Should be an Array!" })
        const allFoods = []
        for (const element of food) {
            if (!element.foodName) return res.send({ status: "error", message: "Food Name Required!" })
            if (!element.foodConsumption) return res.send({ status: "error", message: "Food Consumption unit Required!" })
            allFoods.push({
                foodName: element.foodName,
                foodConsumption: Number(element.foodConsumption),
                pricePerFood: Number(element.foodConsumption) || null
            })
        }
        const creatingReport = new SuperviorReport({
            trip: trip,
            totalPassengers: Number(totalPassengers),
            onboardingPassengers: Number(onboardingPassengers),
            fuelConsuptioninLiter: Number(fuelConsuptioninLiter),
            fuelPricePerLiter: Number(fuelPricePerLiter),
            food: allFoods
        })

        if (others) {
            creatingReport.others = others
        }
        creatingReport.save()

        res.json({ status: "success", success: true, message: "Report Submitted Successfully!" })

    } catch (error) {
        res.send({ status: "error", message: error?.message || "something went wrong while subbmitting report!" })
    }
})

SupervisorRouter.get("/get-all-reports", async (req, res) => {
    try {
        const allReports = await SuperviorReport.find({}).populate("trip", "name")

        res.send(allReports)
    } catch (error) {
        res.send({ status: "error", message: error?.message || "Something went wrong while fetching all reports!" })
    }
})

SupervisorRouter.post("/allocate-food", async (req, res) => {
    try {
        const { trip, foodDetails } = req?.body

        if (!trip) return res.send({ status: "error", message: "Trip Name Required!" })
        if (!mongoose.isValidObjectId(trip)) return res.send({ status: "error", message: "Invalid Trip Id!" })
        if (!Array.isArray(foodDetails)) return res.send({ status: "error", message: "Food details Should be an Array!" })


        const allFoods = []

        if (foodDetails.length > 0) {
            for (const element of foodDetails) {
                if (!element.foodName) continue
                if (!element.quantity) continue
                allFoods.push({
                    foodName: element.foodName,
                    quantity: Number(element.quantity)
                })
            }
        }


        const creatingFoodAllocation = await FoodAllocation.create({
            trip, foodUnit: allFoods.length > 0 ? allFoods : []
        })
        res.send({ status: "success", message: "Food Allocated Successfully!" })
    } catch (error) {
        res.send({ status: "error", message: error?.message || "Something went wrong while food allocation!" })
    }
})

SupervisorRouter.get("/get-trip-food-info", async (req, res) => {
    try {
        const { tripId } = req.query
        if (!tripId) return res.send({ status: "error", message: "Trip Id required!" })
        if (!mongoose.isValidObjectId(tripId)) return res.send({ status: "error", message: "Invalid Trip Id!" })
        const data = await FoodAllocation.findOne({ trip: tripId }).populate("trip", "name")
        res.send({ status: "success", data })
    } catch (error) {
        return res.send({ status: "error", message: "Something went wrong while fetching trip food info" })
    }
})

module.exports = { SupervisorRouter }