const express = require("express")
const jwt = require('jsonwebtoken');
const ejs = require("ejs")
const path = require('node:path');
const { transporter } = require('../service/transporter');
const { TripModel } = require("../model/trip.model");
const { SeatModel } = require("../model/seat.model");
const { AdminAuthentication } = require("../middleware/Authorization");
const { VehicleModel } = require("../model/vehicle.model");
const tripRouter = express.Router()
const { DateTime } = require('luxon')



function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
}


tripRouter.post("/add", async (req, res) => {
    const { name, from, to, busid, journeystartdate, journeyenddate, starttime, endtime, distance, price, totalseats, totaltime, conductor, driver, foodavailability } = req.body;
    try {
        const newtrip = new TripModel({ name, from, to, busid, journeystartdate, journeyenddate, starttime, endtime, totaltime, price, distance, totalseats, bookedseats: 0, availableseats: totalseats, conductor, driver, foodavailability, "driverdetails.LogIn": "00:00", "driverdetails.LogOut": "00:00", "driverdetails.fuel": 0, "driverdetails.maintenance": 0, "conductordetails.LogIn": "00:00", "conductordetails.LogOut": "00:00", "conductordetails.fuel": 0, "conductordetails.fuelCost": 0 })
        await newtrip.save()
        return res.json({ status: "success", message: "Successfully Addeded A New Trip" })
    } catch (error) {
        return res.json({ status: "error", message: "Adding Trip Process Failed" })
    }
})

tripRouter.post("/add/bulk", async (req, res) => {
    const { name, from, to, busid, journeystartdate, journeyenddate, starttime, endtime, distance, totaltime, price, totalseats, time, foodavailability, conductor, driver, } = req.body;
    // Bulk Data Which Will be Stored in Data Base
    const data = [];

    // Convert startDate to a Date object for initial value
    let journeyStartDate = new Date(journeystartdate);
    let journeyEndDate = new Date(journeyenddate);

    // Loop to add 30 consecutive days
    for (let i = 0; i < time; i++) {
        // Format and store the current date in the dates array
        data.push({
            name, from, to, busid, journeystartdate: journeyStartDate.toISOString().split('T')[0], journeyenddate: journeyEndDate.toISOString().split('T')[0], starttime, endtime, distance, totaltime, price, bookedseats: 0, availableseats: totalseats, totalseats, foodavailability, conductor, driver,
        })
        // // Move to the next day
        journeyStartDate.setDate(journeyStartDate.getDate() + 1);
        journeyEndDate.setDate(journeyEndDate.getDate() + 1);
    }

    try {
        await TripModel.insertMany(data)
        return res.json({ status: "success", message: "Successfully Addeded Trip's in Bulk", })
    } catch (error) {
        return res.json({ status: "error", message: `Adding Trip Process Failed ${error.message}` })
    }
})

tripRouter.patch("/edit/:id", async (req, res) => {
    const { id } = req.params;
    let updateData = { ...req?.body };
    if (!req?.body.foodavailability) {
        updateData.foodavailability = false;
    } else {
        updateData.foodavailability = true;
    }
    try {
        const trip = await TripModel.findByIdAndUpdate({ _id: id }, updateData)
        await trip.save();
        return res.json({ status: "success", message: " Trip Details Successfully Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Update  Trip  Details" })
    }
})


tripRouter.patch("/disable/:id", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
        return res.json({ status: 'error', message: 'Trip Id is Required To Disable It.' })
    }
    try {
        const trip = await TripModel.findByIdAndUpdate(id, { disabled: status }, { new: true })
        await trip.save();
        if (trip.length !== 0) {
            return res.json({ status: "success", message: "Trip Disabled Successfully !" })
        } else {
            return res.json({ status: "error", message: "Failed To Disable Trip !" })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Disable Trip, ${error.message}`, })
    }
})

tripRouter.patch("/cancel/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({ status: 'error', message: 'Trip Id is Required To Disable It.' })
    }
    try {
        const trip = await TripModel.findByIdAndUpdate(id, { cancelled: true }, { new: true })
        if (trip.length !== 0) {
            const seats = await SeatModel.find({ tripId: trip._id, "details.status": 'Confirmed' })

            let emails = [];
            let updated_document = []

            for (let index = 0; index < seats.length; index++) {
                console.log(seats[index].details.email);
                if (emails.includes(seats[index].details.email) === false) {
                    emails.push(seats[index].details.email)
                }
            }

            let tripCancelled = path.join(__dirname, "../emailtemplate/tripCancelled.ejs")
            ejs.renderFile(tripCancelled, { user: "Sir/Madam", trip: trip }, function (err, template) {
                if (err) {
                    return res.json({ status: "error", message: err.message })
                } else {
                    const mailOptions = {
                        from: process.env.emailuser,
                        to: `${emails}`,
                        subject: `Trip Cancelled Bus: ${trip.busid}, ${trip.journeystartdate}, ${trip.from} - ${trip.to}`,
                        html: template
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

            // return res.json({ status: "success", message: "Trip Cancelled Successfully !" })
        } else {
            return res.json({ status: "error", message: "Failed To Cancel Trip !" })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To cancel Trip, ${error.message}`, })
    }

})

tripRouter.get("/passenger/list/:id", async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.json({ status: 'error', message: 'Trip Id is Required To Get Details Of All Passengers.' })
    }
    try {
        const list = await SeatModel.find({ tripId: id });
        if (list.length === 0) {
            return res.json({ status: 'error', message: 'No Ticket Booked For This Trip' })
        } else {
            return res.json({ status: 'success', data: list })
        }
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Get Passenger List, ${error.message}`, })
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

        return res.json({ status: "success", data: trips, totalPages: totalPages })
    } catch (error) {
        return res.json({ status: "error", message: "Get List Failed" })
    }
})

tripRouter.get("/list", async (req, res) => {

    const { from, to, date } = req.query
    // Getting Current Date & Time Using Luxon Library

    const currentDate = DateTime.now().setZone('Asia/Kolkata');

    // Format the current date to 'YYYY-MM-DD'
    const todayDate = currentDate.toFormat('yyyy-MM-dd');
    // Format the current time to 'HH:MM'
    const currenttime = currentDate.toFormat('HH:mm');

    // const now = new Date();
    // const currentMinutes = now.getHours() * 60 + now.getMinutes();

    try {
        const trips = await TripModel.find({ from: from, to: to, journeystartdate: date, disabled: false, cancelled: false })

        // const dateObj = new Date();
        // Creating Date
        // const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
        // const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
        // const year = dateObj.getUTCFullYear();
        // const newDate = year + "-" + month + "-" + day;

        // Checking For Current Date If The Current Date & Date passed in Query is Same Return The list of trips based on timing or return all trip list.
        if (todayDate == date) {
            // const upcomingEvents = trips.filter(item => timeToMinutes(item.starttime) > currentMinutes);
            const upcomingEvents = trips.filter(item => timeToMinutes(item.starttime) > timeToMinutes(currenttime));
            if (upcomingEvents.length >= 1) {
                return res.json({ status: "success", data: upcomingEvents })
            } else {
                return res.json({ status: "error", message: "No Upcoming Trips Found" })
            }
        } else {
            if (trips.length >= 1) {
                return res.json({ status: "success", data: trips })
            } else {
                return res.json({ status: "error", message: "No Upcoming Trips Found" })
            }
        }
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Get List Of Today's Trip's ${error.message}` })
    }
})

// Trip Filter For HR 
tripRouter.get("/list/hr", async (req, res) => {
    const { filter } = req.query;

    try {
        let condition;
        const trips = await TripModel.find({})


        // if (todayDate == date) {
        //     // const upcomingEvents = trips.filter(item => timeToMinutes(item.starttime) > currentMinutes);
        //     const upcomingEvents = trips.filter(item => timeToMinutes(item.starttime) > timeToMinutes(currenttime));
        //     if (upcomingEvents.length >= 1) {
        //         return res.json({ status: "success", data: upcomingEvents })
        //     } else {
        //         return res.json({ status: "error", message: "No Upcoming Trips Found" })
        //     }
        // } else {
        //     if (trips.length >= 1) {
        //         return res.json({ status: "success", data: trips })
        //     } else {
        //         return res.json({ status: "error", message: "No Upcoming Trips Found" })
        //     }
        // }
        return res.json({ status: "status", message: `Working On Trip List's`, data: trips })

    } catch (error) {
        return res.json({ status: "error", message: `Failed To Get List Of Today's Trip's ${error.message}` })
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
            return res.json({ status: "success", data: trips })
        } else {
            return res.json({ status: "error", message: "No Trip Found With This ID" })
        }

    } catch (error) {
        return res.json({ status: "error", message: `Get List Failed ${error.message}` })
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
            return res.json({ status: "success", data: trips, bookings: bookings })
        } else {
            return res.json({ status: "error", message: "No Trip Found With This ID" })
        }

    } catch (error) {
        return res.json({ status: "error", message: `Get List Failed ${error.message}` })
    }
})

tripRouter.get("/assigned/conductor", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    console.log("reached here for mtls ");

    const dateObj = new Date();
    // Creating Date
    const month = (dateObj.getUTCMonth() + 1) < 10 ? String(dateObj.getUTCMonth() + 1).padStart(2, '0') : dateObj.getUTCMonth() + 1 // months from 1-12
    const day = dateObj.getUTCDate() < 10 ? String(dateObj.getUTCDate()).padStart(2, '0') : dateObj.getUTCDate()
    const year = dateObj.getUTCFullYear();
    const newDate = year + "-" + month + "-" + day;

    try {
        const trip = await TripModel.find({ journeystartdate: { $gte: newDate }, conductor: decoded._id })
        if (trip.length > 0) {
            return res.json({ status: "success", data: trip })
        } else {
            return res.json({ status: "error", message: 'No Upcoming Trip Assigned To This Conductor' })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Get List ${error.message}` })
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
            return res.json({ status: "success", data: trip })
        } else {
            return res.json({ status: "error", message: 'No Upcoming Trip Assigned To This Driver' })

        }
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Get List ${error.message}` })
    }
})

tripRouter.patch("/update/driver/details", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    const { id, LogIn, LogOut, fuel, maintenance } = req.body

    try {
        const trip = await TripModel.find({ _id: id, driver: decoded._id })
        if (trip.length === 0) {
            return res.json({ status: "error", message: "No Trip Found With This ID !!" })
        }
        trip[0].driverdetails.LogIn = LogIn;
        trip[0].driverdetails.LogOut = LogOut;
        trip[0].driverdetails.fuel = fuel;
        trip[0].driverdetails.maintenance = maintenance;
        await trip[0].save()
        return res.json({ status: "success", message: " Trip Details Successfully Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update  Trip  Details ${error.message}` })
    }
})

tripRouter.patch("/update/conductor/details", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    const { id, LogIn, LogOut, fuel, fuelCost } = req.body

    try {
        const trip = await TripModel.find({ _id: id, conductor: decoded._id })
        if (trip.length === 0) {
            return res.json({ status: "error", message: "No Trip Found With This ID !!" })
        }
        trip[0].conductordetails.LogIn = LogIn;
        trip[0].conductordetails.LogOut = LogOut;
        trip[0].conductordetails.fuel = fuel;
        trip[0].conductordetails.fuelCost = fuelCost;
        await trip[0].save()
        return res.json({ status: "success", message: " Trip Details Successfully Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update  Trip  Details ${error.message}` })
    }
})


module.exports = { tripRouter }
