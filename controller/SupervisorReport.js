const express = require("express");
const { default: mongoose } = require("mongoose");
const { SuperviorReport, FoodAllocation } = require("../model/SupervisorReport.model");
const { TripModel } = require("../model/trip.model");
const { SeatModel } = require("../model/seat.model");
const SupervisorRouter = express.Router();


SupervisorRouter.post("/submit-report", async (req, res) => {
    try {
        const { trip, totalPassengers, onboardingPassengers, fuelConsuptioninLiter, fuelPricePerLiter, others, food } = req?.body


        if (!trip) return res.json({ status: "error", message: "Trip Name Required!" })
        if (!mongoose.isValidObjectId(trip)) return res.json({ status: "error", message: "Invalid Trip Id!" })
        if (!totalPassengers) return res.json({ status: "error", message: "Total Passengers field Required!" })
        if (!onboardingPassengers) return res.json({ status: "error", message: "Onboarding Passengers field Required!" })
        if (!fuelConsuptioninLiter) return res.json({ status: "error", message: "Fuel ConsuptioninLiter field Required!" })
        if (!fuelPricePerLiter) return res.json({ status: "error", message: "Fuel Price Per Liter field Required!" })

        if (!Array.isArray(food)) return res.json({ status: "error", message: "Food Should be an Array!" })
        const allFoods = []
        for (const element of food) {
            if (!element.foodName) return res.json({ status: "error", message: "Food Name Required!" })
            if (!element.foodConsumption) return res.json({ status: "error", message: "Food Consumption unit Required!" })
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

        return res.json({ status: "success", success: true, message: "Report Submitted Successfully!" })
    } catch (error) {
        return res.json({ status: "error", message: error?.message || "something went wrong while subbmitting report!" })
    }
})


SupervisorRouter.get("/report/detail/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({ status: 'error', message: 'Trip Id is Required To Fetch Report Details.' })
    }
    try {
        // Passenger List 
        // Food Alloted Details
        // Fuel Details 
        // Current Reading 
        // Additional Description

        const tripdetails = await TripModel.find({ _id: id });
        console.log("tripdetails", tripdetails[0]);

        const seatdetails = await SeatModel.find({ tripId: id, "details.onboarded": true, "details.status": "Confirmed" });
        console.log("seatdetails  ", seatdetails);

        // Return Value
        const totalSeats = tripdetails[0].bookedseats;
        const onboardedPassengers = seatdetails.length
        console.log("onboardedpassengers", onboardedPassengers);
        console.log("total seats ", totalSeats);

        // Food Details 
        const foodDetails = await FoodAllocation.find({ trip: id })
        console.log("food details", foodDetails[0]);
        const foodalloted = foodDetails[0].allocatedFood;
        const foodconsumed = foodDetails[0].foodUnit;

        // Fuel & Other Details 
        const otherdetails = await SuperviorReport.find({ trip: id })
        console.log("other details ", otherdetails);
        const fuelconsumption = otherdetails[0]?.fuelConsuptioninLiter || 0;
        const fuelprice = otherdetails[0]?.fuelPricePerLiter || 0;
        const currentReading = otherdetails[0]?.currentReading || 0;
        const description = otherdetails[0]?.description || "";


        const data = {
            totalSeats,
            onboardedPassengers,
            foodalloted,
            foodconsumed,
            fuelconsumption,
            fuelprice,
            currentReading,
            description
        }
        return res.json({ status: "success", data: data })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Fetch Report Details ${error.message}` })
    }
})

SupervisorRouter.get("/get-all-reports", async (req, res) => {
    try {
        const allReports = await SuperviorReport.find({}).populate("trip", "name")
        return res.json(allReports)
    } catch (error) {
        return res.json({ status: "error", message: error?.message || "Something went wrong while fetching all reports!" })
    }
})

SupervisorRouter.post("/allocate-food", async (req, res) => {
    try {
        const { trip, foodDetails } = req?.body

        if (!trip) return res.json({ status: "error", message: "Trip Name Required!" })
        if (!mongoose.isValidObjectId(trip)) return res.json({ status: "error", message: "Invalid Trip Id!" })
        if (!Array.isArray(foodDetails)) return res.json({ status: "error", message: "Food details Should be an Array!" })


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
            trip, foodUnit: allFoods.length > 0 ? allFoods : [],
            allocatedFood: allFoods.length > 0 ? allFoods : []
        })
        return res.json({ status: "success", message: "Food Allocated Successfully!" })
    } catch (error) {
        return res.json({ status: "error", message: error?.message || "Something went wrong while food allocation!" })
    }
})


SupervisorRouter.patch("/allocate-food/update/:id", async (req, res) => {

    try {
        const { trip, foodDetails } = req?.body

        if (!trip) return res.json({ status: "error", message: "Trip Name Required!" })
        if (!mongoose.isValidObjectId(trip)) return res.json({ status: "error", message: "Invalid Trip Id!" })
        if (!Array.isArray(foodDetails)) return res.json({ status: "error", message: "Food details Should be an Array!" })

        const result = await FoodAllocation.updateOne(
            {
                trip: new mongoose.Types.ObjectId(trip)
            },
            {
                foodUnit: foodDetails,
                allocatedFood: foodDetails
            },
            { new: true }
        );

        return res.json({ status: "success", message: "Food Allocated Successfully!" })
    } catch (error) {
        return res.json({ status: "error", message: error?.message || "Something went wrong while food allocation!" })
    }
})

SupervisorRouter.get("/get-trip-food-info", async (req, res) => {
    try {
        const { tripId } = req.query
        if (!tripId) return res.json({ status: "error", message: "Trip Id required!" })
        if (!mongoose.isValidObjectId(tripId)) return res.json({ status: "error", message: "Invalid Trip Id!" })
        const data = await FoodAllocation.findOne({ trip: tripId }).populate("trip", "name")
        return res.json({ status: "success", data })
    } catch (error) {
        return res.json({ status: "error", message: "Something went wrong while fetching trip food info" })
    }
})

module.exports = { SupervisorRouter }