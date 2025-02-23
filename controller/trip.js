const express = require("express")
const jwt = require('jsonwebtoken');
const { TripModel } = require("../model/trip.model");
const { SeatModel } = require("../model/seat.model");
const { AdminAuthentication } = require("../middleware/Authorization");
const { VehicleModel } = require("../model/vehicle.model");
const tripRouter = express.Router()


function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
}


tripRouter.post("/add", async (req, res) => {
    const { name, from, to, busid, journeystartdate, journeyenddate, starttime, endtime, distance, price, totalseats, totaltime, conductor, driver, foodavailability } = req.body;
    try {
        const newtrip = new TripModel({ name, from, to, busid, journeystartdate, journeyenddate, starttime, endtime, totaltime, price, distance, totalseats, bookedseats: 0, availableseats: totalseats, conductor, driver, foodavailability, "driverdetails.LogIn": "00:00", "driverdetails.LogOut": "00:00", "driverdetails.fuel": 0, "driverdetails.maintenance": 0, "conductordetails.LogIn": "00:00", "conductordetails.LogOut": "00:00", "conductordetails.fuel": 0, "conductordetails.fuelCost": 0 })
        await newtrip.save()
        res.json({ status: "success", message: "Successfully Addeded A New Trip" })
    } catch (error) {
        res.json({ status: "error", message: "Adding Trip Process Failed" })
    }
})

tripRouter.post("/add/bulk", async (req, res) => {
    const { name, from, to, busid, journeystartdate, journeyenddate, starttime, endtime, distance, totaltime, price, totalseats, time } = req.body;
    // Bulk Data Which Will be Stored in Data Base
    const data = [];

    // Convert startDate to a Date object for initial value
    let journeyStartDate = new Date(journeystartdate);
    let journeyEndDate = new Date(journeyenddate);

    // Loop to add 30 consecutive days
    for (let i = 0; i < time; i++) {
        // Format and store the current date in the dates array
        data.push({
            name, from, to, busid, journeystartdate: journeyStartDate.toISOString().split('T')[0], journeyenddate: journeyEndDate.toISOString().split('T')[0], starttime, endtime, distance, totaltime, price, bookedseats: 0, availableseats: totalseats, totalseats
        })
        // // Move to the next day
        journeyStartDate.setDate(journeyStartDate.getDate() + 1);
        journeyEndDate.setDate(journeyEndDate.getDate() + 1);
    }

    try {
        await TripModel.insertMany(data)
        res.json({ status: "success", message: "Successfully Addeded Trip's in Bulk", })
    } catch (error) {
        res.json({ status: "error", message: `Adding Trip Process Failed ${error.message}` })
    }
})

tripRouter.patch("/edit/:id", async (req, res) => {
    const { id } = req.params
    try {
        const trip = await TripModel.findByIdAndUpdate({ _id: id }, req.body)
        await trip.save()
        res.json({ status: "success", message: " Trip Details Successfully Updated !!" })
    } catch (error) {
        res.json({ status: "error", message: "Failed To Update  Trip  Details" })
    }
})

tripRouter.get("/listall", async (req, res) => {
    const { page, limit } = req.query;
    try {
        const skip = (page - 1) * limit;

        // Fetch paginated documents
        const trips = await TripModel.find()
            .sort({ journeystartdate: -1 })
            .skip(skip)
            .limit(limit)
            .exec();

        // Get the total number of documents in the collection
        const totalDocuments = await TripModel.countDocuments();

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalDocuments / limit);

        // const trips = await TripModel.find({}).sort({ journeystartdate: -1 }).limit(25)    

        res.json({ status: "success", data: trips, totalPages: totalPages })
    } catch (error) {
        res.json({ status: "error", message: "Get List Failed" })
    }
})

tripRouter.get("/list", async (req, res) => {
    const { from, to, date } = req.query
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    try {
        const trips = await TripModel.find({ from: from, to: to, journeystartdate: date })
        const dateObj = new Date();
        // Creating Date
        const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
        const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
        const year = dateObj.getUTCFullYear();
        const newDate = year + "-" + month + "-" + day;

        // Checking For Current Date If The Current Date & Date passed in Query is Same Return The list of trips based on timing or return all trip list.
        if (newDate == date) {
            const upcomingEvents = trips.filter(item => timeToMinutes(item.starttime) > currentMinutes);
            if (upcomingEvents.length >= 1) {
                res.json({ status: "success", data: upcomingEvents })
            } else {
                res.json({ status: "error", message: "No Upcoming Trips Found" })
            }
        } else {
            if (trips.length >= 1) {
                res.json({ status: "success", data: trips })
            } else {
                res.json({ status: "error", message: "No Upcoming Trips Found" })
            }
        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get List Of Today's Trip's ${error.message}` })
    }
})

tripRouter.get("/detailone/:id", async (req, res) => {
    try {
        const trips = await TripModel.find({ _id: req.params.id })
        if (trips.length === 0) {
            return res.json({ status: "error", message: "No Trip Found With This ID" })
        }
        const seats = await SeatModel.find({ tripId: req.params.id })

        const vehicle = await VehicleModel.find({ name: trips[0].busid })

        // Seat's Which are already booked & Payment is completed
        let bookedseats = trips[0].seatsbooked;

        // check the list of Seat's whose seats are already booked. So that we can inform the user to change his seat's
        let lockedseats = [];

        for (let index = 0; index < seats.length; index++) {
            if (seats[index].details.status == "Pending") {
                lockedseats.push(seats[index].seatNumber)
            }
        }

        let currentseat = bookedseats.concat(lockedseats)

        trips[0].facilities = vehicle[0].facilities

        trips[0].seatsbooked = currentseat

        trips[0].bookedseats = currentseat.length;

        trips[0].availableseats = trips[0].totalseats - currentseat.length

        if (trips.length !== 0) {
            res.json({ status: "success", data: trips })
        } else {
            res.json({ status: "error", message: "No Trip Found With This ID" })
        }

    } catch (error) {
        res.json({ status: "error", message: `Get List Failed ${error.message}` })
    }
})

tripRouter.get("/booking/:id", async (req, res) => {
    try {
        const trips = await TripModel.find({ _id: req.params.id })
        if (trips.length === 0) {
            return res.json({ status: "error", message: "No Trip Found With This ID" })
        }
        const seats = await SeatModel.find({ tripId: req.params.id })

        const vehicle = await VehicleModel.find({ name: trips[0].busid })

        // Seat's Which are already booked & Payment is completed
        let bookedseats = trips[0].seatsbooked;

        // check the list of Seat's whose seats are already booked. So that we can inform the user to change his seat's
        let lockedseats = [];
        let bookings = []
        for (let index = 0; index < seats.length; index++) {
            if (seats[index].details.status == "Pending") {
                lockedseats.push(seats[index].seatNumber)
            } else {
                bookings.push(seats[index])
            }
        }
        let currentseat = bookedseats.concat(lockedseats)
        trips[0].facilities = vehicle[0].facilities
        trips[0].seatsbooked = currentseat
        trips[0].bookedseats = currentseat.length;
        trips[0].availableseats = trips[0].totalseats - currentseat.length
        if (trips.length !== 0) {
            res.json({ status: "success", data: trips, bookings: bookings })
        } else {
            res.json({ status: "error", message: "No Trip Found With This ID" })
        }

    } catch (error) {
        res.json({ status: "error", message: `Get List Failed ${error.message}` })
    }
})



tripRouter.get("/assigned/conductor", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')

    const dateObj = new Date();
    // Creating Date
    const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
    const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear();
    const newDate = year + "-" + month + "-" + day;

    try {
        const trip = await TripModel.find({ journeystartdate: { $gte: newDate }, conductor: decoded._id })
        if (trip.length > 0) {
            res.json({ status: "success", data: trip })
        } else {
            res.json({ status: "error", message: 'No Upcoming Trip Assigned To This Conductor' })

        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get List ${error.message}` })
    }
})

tripRouter.get("/assigned/driver", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    const dateObj = new Date();
    // Creating Date
    const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
    const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear();
    const newDate = year + "-" + month + "-" + day;

    try {
        const trip = await TripModel.find({ journeystartdate: { $gte: newDate }, driver: decoded._id })
        if (trip.length > 0) {
            res.json({ status: "success", data: trip })
        } else {
            res.json({ status: "error", message: 'No Upcoming Trip Assigned To This Driver' })

        }
    } catch (error) {
        res.json({ status: "error", message: `Failed To Get List ${error.message}` })
    }
})

tripRouter.patch("/update/driver/details", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    const { id, LogIn, LogOut, fuel, maintenance } = req.body

    try {
        const trip = await TripModel.find({ _id: id, driver: decoded._id })
        if (trip.length === 0) {
            res.json({ status: "error", message: "No Trip Found With This ID !!" })
        }
        trip[0].driverdetails.LogIn = LogIn;
        trip[0].driverdetails.LogOut = LogOut;
        trip[0].driverdetails.fuel = fuel;
        trip[0].driverdetails.maintenance = maintenance;
        await trip[0].save()
        res.json({ status: "success", message: " Trip Details Successfully Updated !!" })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update  Trip  Details ${error.message}` })
    }
})

tripRouter.patch("/update/conductor/details", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    const { id, LogIn, LogOut, fuel, fuelCost } = req.body

    try {
        const trip = await TripModel.find({ _id: id, conductor: decoded._id })
        if (trip.length === 0) {
            res.json({ status: "error", message: "No Trip Found With This ID !!" })
        }
        trip[0].conductordetails.LogIn = LogIn;
        trip[0].conductordetails.LogOut = LogOut;
        trip[0].conductordetails.fuel = fuel;
        trip[0].conductordetails.fuelCost = fuelCost;
        await trip[0].save()
        res.json({ status: "success", message: " Trip Details Successfully Updated !!" })
    } catch (error) {
        res.json({ status: "error", message: `Failed To Update  Trip  Details ${error.message}` })
    }
})


module.exports = { tripRouter }