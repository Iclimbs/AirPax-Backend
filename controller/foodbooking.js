require('dotenv').config()
const express = require("express");
const jwt = require('jsonwebtoken');
const { FoodBookingModel } = require('../model/foodbooking.model');
const { AdminAuthentication } = require('../middleware/Authorization');
const { FoodAllocation } = require('../model/SupervisorReport.model');
const FoodBookingRouter = express.Router()

FoodBookingRouter.post("/add", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')

    const { foodItems, price, seatId, tripId } = req.body;
    try {
        const newfood = new FoodBookingModel({ foodItems, price, seatId, tripId, bookedBy: decoded._id })
        await newfood.save()

        // Updating Allocated Food Details 
        let foodServed = [];
        let totalAllocatedFood;
        // Get Food Items Which Are Served
        for (let index = 0; index < foodItems.length; index++) {
            foodServed.push(foodItems[index])
        }

        const allocatedFood = await FoodAllocation.find({ trip: tripId })
        totalAllocatedFood = allocatedFood[0].foodUnit;

        const servedMap = {};

        foodServed.forEach(({ name, quantity }) => {
            if (servedMap[name]) {
                servedMap[name] += quantity;
            } else {
                servedMap[name] = quantity;
            }
        });

        // Update quantities
        totalAllocatedFood.forEach(foodItem => {
            if (servedMap.hasOwnProperty(foodItem.foodName)) {
                foodItem.quantity -= servedMap[foodItem.foodName];
            }
        });

        const updateFoodAllocation = await FoodAllocation.findOneAndUpdate({ trip: tripId }, { $set: { foodUnit: totalAllocatedFood } }, { new: true });

        if (updateFoodAllocation === null) {
            return res.json({ status: 'error', message: `Failed To Update Food Allocation Details.` })
        } else {
            return res.json({ status: "success", message: "Food Order Successful !!" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Order Food For The User ${error.message}` })
    }
})



FoodBookingRouter.get("/detail/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params;
    try {
        const foodOrdered = await FoodBookingModel.find({ tripId: id });
        return res.json({ status: "success", data: foodOrdered });
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Fet Food Ordered Details ${error.message}` })
    }
})

module.exports = { FoodBookingRouter }