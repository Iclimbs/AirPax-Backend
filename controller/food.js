require('dotenv').config()
const express = require("express")
const { FoodModel } = require("../model/food.model")
const { default: mongoose } = require('mongoose')
const { FoodAllocation } = require('../model/SupervisorReport.model')
const FoodRouter = express.Router()

FoodRouter.post("/add", async (req, res) => {
    const { name, price, availableAt } = req.body;
    try {
        if (!name) return res.json({ status: "error", message: "Name required!" })
        if (!price) return res.json({ status: "error", message: "Price required!" })
        if (!availableAt) return res.json({ status: "error", message: "availableAt field required!" })
        //         if (availableAt) {
        //             if (availableAt !== "In Bus" && availableAt !== "Agra lounge"){
        //                 return res.send({status:"error",message:"You can pass "})
        //             }
        // }
        const newfood = new FoodModel({ name, price, availableAt })
        await newfood.save()
        return res.json({ status: "success", message: "New Food Item Added !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Add New Food Item" })
    }
})

FoodRouter.patch("/edit/:id", async (req, res) => {
    const { id } = req.params
    try {
        const food = await FoodModel.findByIdAndUpdate({ _id: id }, req.body)
        await food.save()
        return res.json({ status: "success", message: "Food Item Details Successfully Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Update Food Item Details" })
    }
})


FoodRouter.patch("/disable/:id", async (req, res) => {
    const { id } = req.params
    try {
        const food = await FoodModel.findById({ _id: id })
        food.available = !food.available;
        await food.save()
        return res.json({ status: "success", message: "Food Item Availability Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Update Food Item Availability Details" })
    }
})


FoodRouter.get("/listall", async (req, res) => {
    try {
        const foodList = await FoodModel.find()
        return res.json({ status: "success", data: foodList })
    } catch (error) {
        return res.json({ status: "error", message: error.message })
    }
})

FoodRouter.get("/listall/active", async (req, res) => {
    try {
        const foodList = await FoodModel.find({ available: true }, { available: 0, CreatedAt: 0 })
        if (foodList.length >= 1) {
            return res.json({ status: "success", data: foodList })
        } else {
            return res.json({ status: "error", message: "No Food Item is Available Right Now !" })
        }
    } catch (error) {
        return res.json({ status: "error", message: error.message })
    }
})


FoodRouter.get("/listall/active/food-allocation/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const foodList = await FoodAllocation.aggregate([{ $match: { trip : new mongoose.Types.ObjectId(id) }}])
        console.log("food list ", foodList);

        if (foodList.length >= 1) {
            return res.json({ status: "success", data: foodList })
        } else {
            return res.json({ status: "error", message: "No Food Item is Available Right Now !" })
        }
    } catch (error) {
        return res.json({ status: "error", message: error.message })
    }
})


FoodRouter.get("/listall/active/:condition", async (req, res) => {
    const { condition } = req.params;
    console.log("");

    try {
        const foodList = await FoodModel.find({ available: true, availableAt: condition }, { available: 0, CreatedAt: 0 })
        if (foodList.length >= 1) {
            return res.json({ status: "success", data: foodList })
        } else {
            return res.json({ status: "error", message: "No Food Item is Available Right Now !" })
        }
    } catch (error) {
        return res.json({ status: "error", message: error.message })
    }
})


module.exports = { FoodRouter }