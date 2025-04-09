require('dotenv').config()
const express = require("express");
const jwt = require('jsonwebtoken');
const ejs = require("ejs")
const path = require('node:path');
const { FoodBookingModel } = require('../model/foodbooking.model');
const { AdminAuthentication } = require('../middleware/Authorization');
const { FoodAllocation } = require('../model/SupervisorReport.model');
const { SeatModel } = require('../model/seat.model');
const { TripModel } = require('../model/trip.model');
const { transporter } = require('../service/transporter');
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
        }
        // 1. Find Seat Details
        const seatdetails = await SeatModel.findOne({_id:seatId});
        

        // 2. Find Trip Details
        const tripdetails = await TripModel.find({_id:tripId})
        

        let confirmpayment = path.join(__dirname, "../emailtemplate/foodbooking.ejs")
        ejs.renderFile(confirmpayment, { user: seatdetails.details, seat: seatdetails, trip: tripdetails[0], amount:price,pnr:seatdetails.pnr, food:foodItems }, async function (err, template) {
            if (err) {
                return res.json({ status: "error", message: err.message })
            } else {
                const mailOptions = {
                    from: process.env.emailuser,
                    to: `${seatdetails.details.email}`,
                    bcc: process.env.imp_email,
                    subject: `Food Order Confirmation on AIRPAX, Bus: ${tripdetails[0].busid}, ${tripdetails[0].journeystartdate}, ${tripdetails[0].from} - ${tripdetails[0].to}`,
                    html: template,
                }
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("Error in Sending Mail ", error.message);
                        return res.json({ status: "error", message: 'Failed to send email' });
                    } else {
                        console.log("Email Sent ", info);
                        return res.json({ status: "success", message: 'Please Check Your Email', redirect: "/" });
                    }
                })
            }
        })

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