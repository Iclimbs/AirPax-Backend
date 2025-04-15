require('dotenv').config()
const express = require("express")
const { SeatModel } = require("../model/seat.model")
const { TripModel } = require("../model/trip.model");
const { PaymentModel } = require('../model/payment.model');
const { UserModel } = require('../model/user.model');
const ejs = require("ejs")
const path = require('node:path');
const { transporter } = require('../service/transporter');
const { BookingModel } = require('../model/booking.model');
const { RoutesModel } = require('../model/routes.model');
const PaymentRouter = express.Router()

PaymentRouter.get("/success/:pnr/:ref_no/:mode", async (req, res) => {
    const { pnr, ref_no, mode } = req.params
    let emails = [];
    let pickupid = "";
    let dropoffid = "";
    const filter = { pnr: pnr };
    const update = {
        $set: { isBooked: true, expireAt: null, "details.status": "Confirmed" }
    } // set status field
    // Step 1 Getting The list of all the seat's with this PNR & Updating their status
    try {
        const seat = await SeatModel.updateMany(filter, update);
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Seat Status ${error.message}` })
    }
    // Get All Emails 

    const bookedSeats = await SeatModel.find({ pnr: pnr, "details.status": "Confirmed" })

    for (let index = 0; index < bookedSeats.length; index++) {
        if (pickupid === "") {
            pickupid = bookedSeats[index].pickup
        }
        if (dropoffid === "") {
            dropoffid = bookedSeats[index].dropoff
        }
        if (emails.includes(bookedSeats[index].details?.email.toLowerCase()) === false) {
            emails.push(bookedSeats[index].details.email.toLowerCase())
        }
    }

    // Step 2 Finding the payment status of the PNR & Updating their Status
    const paymentdetails = await PaymentModel.find({ pnr: pnr })
    paymentdetails[0].paymentstatus = "Confirmed";
    paymentdetails[0].refno = ref_no;
    paymentdetails[0].method = mode;
    try {
        await paymentdetails[0].save()
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Payment  Status ${error.message}` })
    }
    const seatdetails = await SeatModel.find({ pnr: pnr, expireAt: null, isBooked: true, isLocked: true, "details.status": "Confirmed" })
    // console.log("seatdetails ", seatdetails);

    // bookedseat contain the list of all the Seats booked with this pnr
    let bookedseats = []

    for (let index = 0; index < seatdetails.length; index++) {
        bookedseats.push(seatdetails[index].seatNumber)
    }

    // Getting User Detail's 
    let userid = seatdetails[0].bookedby;
    // Getting Trip Detail's
    let tripid = seatdetails[0].tripId;

    const userdetails = await UserModel.find({ _id: userid })
    const tripdetails = await TripModel.find({ _id: tripid })
    // Storing the Existing List of Seats which are booked
    let newbookedseats = bookedseats.concat(tripdetails[0].seatsbooked)

    try {
        tripdetails[0].seatsbooked = newbookedseats;
        tripdetails[0].bookedseats = newbookedseats.length;
        tripdetails[0].availableseats = tripdetails[0].totalseats - newbookedseats.length
        await tripdetails[0].save()
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Trip Booked Seat Details ${error.message}` })
    }

    // Working On Booking Model's 

    const BookingDetails = new BookingModel({
        name: tripdetails[0].name,
        from: tripdetails[0].from,
        to: tripdetails[0].to,
        journeystartdate: tripdetails[0].journeystartdate,
        journeyenddate: tripdetails[0].journeyenddate,
        busid: tripdetails[0].busid,
        starttime: tripdetails[0].starttime,
        endtime: tripdetails[0].endtime,
        totaltime: tripdetails[0].totaltime,
        distance: tripdetails[0].distance,
        pnr,
        pickupid,
        dropoffid,
        seats: bookedseats,
        userid: userdetails[0]._id,
        tripId: tripdetails[0]._id
    })
    const bookingExists = await BookingModel.find({ pnr: pnr, userid: userdetails[0]._id, tripId: tripdetails[0]._id })
    if (bookingExists.length === 0) {
        try {
            await BookingDetails.save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Save Booking Detail's ${error.message}` })
        }
    }
    const pickupdetails = await RoutesModel.find({ _id: pickupid })
    console.log("pickup", pickupdetails);

    const dropoffdetails = await RoutesModel.find({ _id: dropoffid })
    console.log("drop", dropoffdetails);

    if (pickupdetails.length === 0 || dropoffdetails.length === 0) {
        return res.json({ status: 'error', message: 'Both PickUp & DropOff Details are required!' })
    }

    let confirmpayment = path.join(__dirname, "../emailtemplate/confirmpayment.ejs")

    ejs.renderFile(confirmpayment, { user: userdetails[0], seat: seatdetails, pickup: pickupdetails[0], dropoff: dropoffdetails[0], trip: tripdetails[0], payment: paymentdetails[0] }, async function (err, template) {
        if (err) {
            return res.json({ status: "error", message: err.message })
        } else {

            const mailOptions = {
                from: process.env.emailuser,
                to: `${userdetails[0].email}`,
                cc: `${emails}`,
                bcc: process.env.imp_email,
                subject: `Booking Confirmation on AIRPAX, Bus: ${tripdetails[0].busid}, ${tripdetails[0].journeystartdate}, ${tripdetails[0].from} - ${tripdetails[0].to}`,
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
})


PaymentRouter.get("/failure/:pnr/:ref_no/:mode", async (req, res) => {
    const { pnr, ref_no, mode } = req.params;
    const filter = { pnr: pnr };
    const update = {
        $set: { isBooked: false, isLocked: false, expireAt: null, "details.status": "Failed" }
    }
    // Step 1 Getting The list of all the seat's with this PNR & Updating their status
    try {
        const seat = await SeatModel.updateMany(filter, update);
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Seat Status ${error.message}` })
    }

    let emails = [];
    let tripId;

    const bookedSeats = await SeatModel.find({ pnr: pnr, "details.status": "Failed" })
    if (bookedSeats.length !== 0) {
        tripId = bookedSeats[0].tripId;
    }
    for (let index = 0; index < bookedSeats.length; index++) {
        if (emails.includes(bookedSeats[index].details?.email.toLowerCase()) === false) {
            emails.push(bookedSeats[index].details.email.toLowerCase())
        }
    }

    const tripdetails = await TripModel.find({ _id: tripId })

    // Step 2 Finding the payment status of the PNR & Updating their Status
    const paymentdetails = await PaymentModel.find({ pnr: pnr })
    paymentdetails[0].paymentstatus = "Failed";
    paymentdetails[0].refno = ref_no;
    paymentdetails[0].method = mode;
    try {
        await paymentdetails[0].save()
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Payment  Status ${error.message}` })
    }
    let failedpayment = path.join(__dirname, "../emailtemplate/failedpayment.ejs")
    ejs.renderFile(failedpayment, { user: "Sir/Madam", seat: bookedSeats, trip: tripdetails[0], payment: paymentdetails[0] }, function (err, template) {
        if (err) {
            return res.json({ status: "error", message: err.message })
        } else {
            const mailOptions = {
                from: process.env.emailuser,
                to: `${emails}`,
                bcc: process.env.imp_email,
                subject: `Booking Failed on AIRPAX, Bus: ${tripdetails[0].busid}, ${tripdetails[0].journeystartdate}, ${tripdetails[0].from} - ${tripdetails[0].to}`,
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
})





module.exports = { PaymentRouter }