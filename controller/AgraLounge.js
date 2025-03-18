const express = require("express")
const { default: mongoose } = require("mongoose");
const { agraLoungeFoodOrders } = require("../model/agraLounge.model");
const { FoodModel } = require("../model/food.model");
const AgraLounge = express.Router()


AgraLounge.post("/create-order", async (req, res) => {
    const { items, phoneNumber, paymentMethod, } = req.body;
    try {

        if (!Array.isArray(items)) return res.json({ status: "error", message: "items Should be an array field!" })
        if (items.length == 0) return res.json({ status: "error", message: "Atleast one item required!" })

        if (!phoneNumber || phoneNumber == "" || phoneNumber == " ") return res.json({ status: "error", message: "Phone Number Required!" })
        if (phoneNumber.length < 10) return res.json({ status: "error", message: "Invalid Phone Number" })
        if (!paymentMethod || paymentMethod == "" || paymentMethod == " ") return res.json({ status: "error", message: "Invalid payment method!" })
        if (paymentMethod !== "cash" && paymentMethod !== "online") return res.json({ status: "error", message: "Invalid payment method!" })
        const allItems = []
        let totalAmount = 0
        for (const i of items) {
            if (!mongoose.isValidObjectId(i.itemsId)) return res.json({ status: "error", message: "Invalid Item Id!" })
            if (!i.quantity > 0) return res.json({ status: "error", message: "Minimum one Quantity required!" })
            const findingItem = await FoodModel.findById(i.itemsId)
            if (!findingItem) return res.json({ status: "error", message: "Item not Found!" })
            // console.log(findingItem);
            if (findingItem.available == false) return res.json({ status: "error", message: `${findingItem.name} not Available!` })
            allItems.push({ itemsId: i.itemsId, quantity: i.quantity, pricePerItem: Number(findingItem.price) })
            totalAmount += Number(i.quantity * findingItem.price)
        }

        console.log(totalAmount);
        const newfood = new agraLoungeFoodOrders({ items: allItems, totalAmount: totalAmount, phoneNumber, paymentMethod })
        await newfood.save()
        res.json({ status: "success", message: "New Food Item Added !!" })
    } catch (error) {
        res.json({ status: "error", message: error })
    }
})

AgraLounge.get("/get-all-orders", async (req, res) => {
    try {
        const allOrders = await agraLoungeFoodOrders.find({}).sort({ createdAt: -1 })
        res.send(allOrders)
    } catch (error) {
        res.json({ status: "error", message: error })
    }
})

module.exports = { AgraLounge }