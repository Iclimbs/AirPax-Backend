const express = require("express")
const { TripModel } = require("../model/trip.model");
const { OtherUserModel } = require('../model/Other.seat.model');
const { SeatModel } = require("../model/seat.model");
const { VehicleModel } = require("../model/vehicle.model");
const { BookingModel } = require("../model/booking.model");
const PnrRouter = express.Router()

PnrRouter.get("/", async (req, res) => {
    const { pnr } = req.query
    // Creating An Object which will contain all the basic details required for the user.
    let details = {};
    details.passengerdetails = [];
    // Getting the list of Seats Booked 
    const ticketdetails = await SeatModel.find({ pnr: pnr }, { _id: 0, CreatedAt: 0 })

    // Sending No Ticket Detail's Found Message To User
    if (ticketdetails.length == 0) {
        return res.json({ status: "error", message: "No Ticket Detail's Found Related to this Pnr" })
    }

    // Inserting All Passenger Detail's List In Passenger Detail's Array 
    for (let index = 0; index < ticketdetails.length; index++) {
        details.passengerdetails.push(ticketdetails[index].details)
    }

    const tripdetails = await TripModel.find({ _id: ticketdetails[0].tripId })

    if (tripdetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Detail's Found Related to this Pnr" })
    }

    const vehicledetails = await VehicleModel.find({ name: tripdetails[0].busid })

    if (vehicledetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Detail's Found Related to this Pnr" })
    }


    details.tripId = tripdetails[0]._id;
    details.from = tripdetails[0].from;
    details.to = tripdetails[0].to;
    details.journeystartdate = tripdetails[0].journeystartdate;
    details.journeyenddate = tripdetails[0].journeyenddate;
    details.busid = vehicledetails[0].gpsname;
    details.starttime = tripdetails[0].starttime;
    details.endtime = tripdetails[0].endtime;
    details.totaltime = tripdetails[0].totaltime;
    details.distance = tripdetails[0].distance;
    return res.json({ status: "success", details: details })
})

PnrRouter.get("/guest", async (req, res) => {
    const { pnr, email } = req.query
    // Creating An Object which will contain all the basic details required for the user.
    let details = {};
    details.passengerdetails = [];
    // Getting the list of Seats Booked 
    const ticketdetails = await SeatModel.find({ pnr: pnr, "details.email": email }, { _id: 0, CreatedAt: 0 })

    const bookingdetails = await BookingModel.find({ pnr: pnr, status: "Confirmed" })
    if (bookingdetails.length == 0) {
        return res.json({ status: "error", message: "No Confirmed Booking Detail's Found Related to this Pnr" })
    }

    // Sending No Ticket Detail's Found Message To User
    if (ticketdetails.length == 0) {
        return res.json({ status: "error", message: "No Ticket Detail's Found Related to this Pnr" })
    }

    // Inserting All Passenger Detail's List In Passenger Detail's Array 
    for (let index = 0; index < ticketdetails.length; index++) {
        details.passengerdetails.push(ticketdetails[index].details)
    }

    const tripdetails = await TripModel.find({ _id: ticketdetails[0].tripId })

    if (tripdetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Detail's Found Related to this Pnr" })
    }
    const vehicledetails = await VehicleModel.find({ name: tripdetails[0].busid })

    if (vehicledetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Detail's Found Related to this Pnr" })
    }

    details.bookingId = bookingdetails[0]._id
    details.tripId = tripdetails[0]._id;
    details.from = tripdetails[0].from;
    details.to = tripdetails[0].to;
    details.journeystartdate = tripdetails[0].journeystartdate;
    details.journeyenddate = tripdetails[0].journeyenddate;
    details.busid = vehicledetails[0].gpsname;
    details.starttime = tripdetails[0].starttime;
    details.endtime = tripdetails[0].endtime;
    details.totaltime = tripdetails[0].totaltime;
    details.distance = tripdetails[0].distance;
    return res.json({ status: "success", details: details })
})

PnrRouter.get("/gmr/:pnr", async (req, res) => {
    const { pnr } = req.params;
    let details = {};
    const ticketdetails = await OtherUserModel.find({ pnr: pnr }, { _id: 0, CreatedAt: 0 })
    if (ticketdetails.length == 0) {
        return res.json({ status: "error", message: "No Ticket Detail's Found Related to this Pnr" })
    }
    details.user = ticketdetails[0].primaryuser;
    details.bookedticket = ticketdetails[0].passengerdetails;
    const tripdetails = await TripModel.find({ _id: ticketdetails[0].tripId })


    if (tripdetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Detail's Found Related to this Pnr" })
    }
    const vehicledetails = await VehicleModel.find({ name: tripdetails[0].busid })

    if (vehicledetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Detail's Found Related to this Pnr" })
    }

    details.tripId = tripdetails[0]._id;
    details.from = tripdetails[0].from;
    details.to = tripdetails[0].to;
    details.journeystartdate = tripdetails[0].journeystartdate;
    details.journeyenddate = tripdetails[0].journeyenddate;
    details.busid = vehicledetails[0].gpsname;
    details.starttime = tripdetails[0].starttime;
    details.endtime = tripdetails[0].endtime;
    details.totaltime = tripdetails[0].totaltime;
    details.distance = tripdetails[0].distance;
    return res.json({ status: "success", message: "Pnr Detail's", details: details })
})


module.exports = { PnrRouter }