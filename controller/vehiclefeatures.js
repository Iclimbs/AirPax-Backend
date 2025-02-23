require('dotenv').config()
const express = require("express")
const FeatureRouter = express.Router()
const { vehicleFeaturesModel } = require('../model/vehiclefeatures.model');
const { uploadMiddleWare } = require('../middleware/FileUpload');

FeatureRouter.post("/add", uploadMiddleWare.single("img"), async (req, res) => {
    const { name } = req.body;
    if (!req.file) {
        return res.json({
            status: 'error',
            message: 'Plase Upload Image'
        })
    }
    try {
        const vehicle = new vehicleFeaturesModel({ name, img: req?.file?.location })
        await vehicle.save()
        res.json({ status: "success", message: "New Vehicle Feature Added !!" })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Add New Vehicle Feature ${error.message}` })
    }
})

FeatureRouter.patch("/edit/:id", uploadMiddleWare.single("img"), async (req, res) => {
    const { id } = req.params
    try {
        const vehicle = await vehicleFeaturesModel.find({ _id: id })
        vehicle[0].name = req.body.name;
        if (req.file) {
            vehicle[0].img = req?.file?.location
        }
        await vehicle[0].save()
        res.json({ status: "success", message: "Features Details Successfully Updated !!" })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update Features Details ${error.message}` })
    }
})

FeatureRouter.patch("/disable/:id", async (req, res) => {
    const { id } = req.params
    try {
        const vehicle = await vehicleFeaturesModel.findById({ _id: id })
        vehicle.status = !vehicle.status;
        await vehicle.save()
        res.json({ status: "success", message: "Feature Status Updated !!" })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update Vehicle Feature Status  ${error.message}` })
    }
})

FeatureRouter.get("/listall", async (req, res) => {
    try {
        const vehicleList = await vehicleFeaturesModel.find({})
        if (vehicleList.length !== 0) {
            res.json({ status: "success", data: vehicleList })
        } else {
            res.json({ status: "error", message: "No Vehicle Feature Found" })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Vehicle Feature List ${error.message}` })
    }
})

FeatureRouter.get("/listall/active", async (req, res) => {
    try {
        const vehicleList = await vehicleFeaturesModel.find({ status: true }, { CreatedAt: 0, status: 0 })
        if (vehicleList.length !== 0) {
            res.json({ status: "success", data: vehicleList })
        } else {
            res.json({ status: "error", message: "No Active Vehicle Feature Found" })
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get Active Vehicle Feature List ${error.message}` })
    }
})

module.exports = { FeatureRouter }