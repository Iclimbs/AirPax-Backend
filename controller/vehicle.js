require('dotenv').config()
const express = require("express")
const { VehicleModel } = require("../model/vehicle.model")
const vehicleRouter = express.Router()

vehicleRouter.post("/add", async (req, res) => {
    const { name, gpsname, gpsimeino, simno, facilities } = req.body;

    try {
        const newvehicle = new VehicleModel({ name, gpsname, gpsimeino, simno, facilities: facilities })
        await newvehicle.save()
        return res.json({ status: "success", message: "New Vehicle Added !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Add New Vehicle" })
    }
})



vehicleRouter.patch("/edit/:id", async (req, res) => {
    const { id } = req.params
    try {
        const vehicle = await VehicleModel.findByIdAndUpdate({ _id: id }, req.body)
        await vehicle.save()
        return res.json({ status: "success", message: "Vehicle Details Successfully Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Update  vehicle  Details" })
    }
})



vehicleRouter.patch("/disable/:id", async (req, res) => {
    const { id } = req.params
    try {
        const vehicle = await VehicleModel.findById({ _id: id })
        vehicle.active = !vehicle.active;
        await vehicle.save()
        return res.json({ status: "success", message: "Vehicle Availability Status Updated Successfully !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Update Vehicle Availability Status" })
    }
})


vehicleRouter.get("/listall", async (req, res) => {
    try {
        const vehicleList = await VehicleModel.find()
        if (vehicleList.length !== 0) {
            return res.json({ status: "success", data: vehicleList })
        } else {
            return res.json({ status: "error", message: "No Bus is Available Right Now !" })
        }
    } catch (error) {
        return res.json({ status: "error", message:`Failed To Fetch Details Of Each Vehicle error:-${error.message}`  })
    }
})


vehicleRouter.get("/listall/active", async (req, res) => {
    try {
        const vehicleList = await VehicleModel.find({active:true})
        if (vehicleList.length !== 0) {
            return res.json({ status: "success", data: vehicleList })
        } else {
            return res.json({ status: "error", message: "No Bus is Available Right Now !" })
        }
    } catch (error) {
        return res.json({ status: "error", message:`Failed To Fetch Details Of Each Vehicle error:-${error.message}`  })
    }
})


vehicleRouter.get("/search/:name", async (req, res) => {
    try {
        const vehicleList = await VehicleModel.find({ name: req.params.name })
        if (vehicleList.length !== 0) {
            return res.json({ status: "success", data: vehicleList })
        } else {
            return res.json({ status: "error", message: "No Vehicle Found With This Partiucarl Name" })
        }
    } catch (error) {
        return res.json({ status: "error", message:`Failed To Fetch Detail Of A Particular Vehicle error:- ${error.message}` })
    }
})


module.exports = { vehicleRouter }