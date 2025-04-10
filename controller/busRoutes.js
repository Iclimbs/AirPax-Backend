// Basic Imports
const express = require('express');
const { RoutesModel } = require('../model/routes.model');

// Model Import

// Creating Router
const BusRoutesRouter = express.Router();

// Generating Bus Routes
BusRoutesRouter.post("/add", async (req, res) => {
    try {
        const { counter, time, purpose, location } = req.body;

        // Optional: Validate required fields
        if (!counter || !time || !purpose || !location) {
            return res.json({
                status: 'error',
                message: 'All fields (counter, time, purpose, location) are required.'
            });
        }

        const addRoutes = new RoutesModel({
            counter,
            time,
            purpose,
            location
        });

        await addRoutes.save();

        return res.json({
            status: 'success',
            message: 'Successfully added a new bus route'
        });
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed to add bus route: ${error.message}`
        });
    }
});

// Getting List Of Different Bus Routes which are active
BusRoutesRouter.get("/list/active", async (req, res) => {
    try {
        const list = await RoutesModel.find({ status: true });
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'Failed To Find Any Acitve Routes For Buses' })
        } else {
            return res.json({
                status: 'success',
                data: list
            });
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed to get details of bus route: ${error.message}`
        });
    }
});

// Getting List Of Different Bus Routes for Admin
BusRoutesRouter.get("/list/admin", async (req, res) => {
    try {
        const list = await RoutesModel.find({});
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'Failed To Find Any Routes For Buses' })
        } else {
            return res.json({
                status: 'success',
                data: list
            });
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed to get details of bus route: ${error.message}`
        });
    }
});


// Disable Or Enable Bus Routes
BusRoutesRouter.get("/list/admin", async (req, res) => {
    try {
        const list = await RoutesModel.find({});
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'Failed To Find Any Routes For Buses' })
        } else {
            return res.json({
                status: 'success',
                data: list
            });
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed to get details of bus route: ${error.message}`
        });
    }
});


// Edit Bus Routes Details
BusRoutesRouter.patch("/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.json({ status: 'error', message: 'Bus Route ID is Required!' })
        }
        let data = {};

        if (req.body?.counter) {
            data.counter = req.body?.counter
        }
        if (req.body?.time) {
            data.time = req.body?.time
        }
        if (req.body?.purpose) {
            data.purpose = req.body?.purpose
        }
        if (req.body?.location) {
            data.location = req.body?.location
        }


        const list = await RoutesModel.findByIdAndUpdate(id, data, { new: true })
        if (list !== null) {
            return res.json({ status: 'success', message: 'Bus Route Details Updated Successfully.' })
        } else {
            return res.json({
                status: 'error',
                data: `Failed To Update Bus Route Detail's`
            });
        }
    } catch (error) {
        return res.json({
            status: 'error',
            message: `Failed to Update bus route detail's : ${error.message}`
        });
    }
});




module.exports = { BusRoutesRouter };

