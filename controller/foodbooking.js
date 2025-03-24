require('dotenv').config()
const express = require("express");
const jwt = require('jsonwebtoken');
const { FoodBookingModel } = require('../model/foodbooking.model');
const { AdminAuthentication } = require('../middleware/Authorization');
const FoodBookingRouter = express.Router()

FoodBookingRouter.post("/add", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')

    const { foodItems, price, seatId, tripId } = req.body;
    try {
        const newfood = new FoodBookingModel({ foodItems, price, seatId, tripId, bookedBy: decoded._id })
        await newfood.save()
        return res.json({ status: "success", message: "Food Order Successful !!" })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Order Food For The User ${error.message}` })
    }
})

module.exports = { FoodBookingRouter }