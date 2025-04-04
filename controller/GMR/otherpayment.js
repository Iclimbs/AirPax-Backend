require('dotenv').config()
const express = require("express")
const ejs = require("ejs")
const path = require('node:path');
const { transporter } = require('../../service/transporter');
const { SeatModel } = require("../../model/seat.model")
const { TripModel } = require("../../model/trip.model");
const { PaymentModel } = require('../../model/payment.model');
const { OtherUserModel } = require('../../model/Other.seat.model');
const { BookingModel } = require('../../model/booking.model');
const OtherPaymentRouter = express.Router()

OtherPaymentRouter.get("/success/", async (req, res) => {
    const { pnr, ref, method } = req.query
    const filter = { pnr: pnr };
    const update = {
        $set: { isBooked: true, expireAt: null, "details.status": "Confirmed" }
    }

    // Updating Detail's in Seat Model Data
    try {
        const seat = await SeatModel.updateMany(filter, update);
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Seat Status ${error.message}` })
    }

    // Updating Detail's in Payment Model Data
    const paymentdetails = await PaymentModel.find({ pnr: pnr });
    paymentdetails[0].refno = ref,
        paymentdetails[0].method = method,
        paymentdetails[0].paymentstatus = "Confirmed"
    try {
        await paymentdetails[0].save()
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Trip Booked Seat Details ${error.message}` })
    }

    // Updating Detail's in Trip Model Data

    const seatdetails = await SeatModel.find({ pnr: pnr, expireAt: null, isBooked: true, isLocked: true, "details.status": "Confirmed" })

    // bookedseat contain the list of all the Seats booked with this pnr
    let bookedseats = []

    for (let index = 0; index < seatdetails.length; index++) {
        bookedseats.push(seatdetails[index].seatNumber)
    }

    // Getting Trip Detail's
    let tripid = seatdetails[0].tripId;

    const tripdata = await TripModel.find({ _id: tripid })
    // Storing the Existing List of Seats which are booked
    let newbookedseats = bookedseats.concat(tripdata[0].seatsbooked)

    try {
        tripdata[0].seatsbooked = newbookedseats;
        tripdata[0].bookedseats = newbookedseats.length;
        tripdata[0].availableseats = tripdata[0].totalseats - newbookedseats.length
        await tripdata[0].save()
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Trip Booked Seat Details ${error.message}` })
    }

    // Updating Detail's in GMR Model Data

    try {
        const userdata = await OtherUserModel.updateOne({ pnr: pnr }, { $set: { "passengerdetails.$[elem].status": "Confirmed" } }, {
            arrayFilters: [{ "elem.status": "Pending" }]
        })

    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Trip Booked Seat Details ${error.message}` })
    }

    const userdetails = await OtherUserModel.find({ pnr: pnr })
    const tripdetails = await TripModel.find({ _id: userdetails[0].tripId })
    let Gmrconfirmpayment = path.join(__dirname, "../../emailtemplate/gmrconfirmpayment.ejs")
    ejs.renderFile(Gmrconfirmpayment, { user: userdetails[0].primaryuser, seat: userdetails[0].passengerdetails, trip: tripdetails[0], pnr: userdetails[0].pnr, amount: userdetails[0].amount }, function (err, template) {
        if (err) {
            return res.json({ status: "error", message: err.message })
        } else {
            const mailOptions = {
                from: process.env.emailuser,
                to: `${userdetails[0].primaryuser.email}`,
                bcc:'uttamkrshaw@iclimbs.com',
                subject: `Booking Confirmation on AIRPAX, Bus: ${tripdetails[0].busid}, ${tripdetails[0].journeystartdate}, ${tripdetails[0].from} - ${tripdetails[0].to}`,
                html: template
            }
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.json({ status: "error", error: 'Failed to send email' });
                } else {
                    return res.json({ status: "success", message: 'Please Check Your Email', redirect: "/" });
                }
            })
        }
    })
})


OtherPaymentRouter.get("/failure/", async (req, res) => {
    const { pnr, ref, method } = req.query
    const filter = { pnr: pnr };
    const update = {
        $set: { isBooked: false, isLocked: false, expireAt: null, "details.status": "Failed" }
    }

    try {
        const seat = await SeatModel.updateMany(filter, update);
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Seat Booking Detail's  ${error.message}` })
    }

    // Updating Detail's in GMR Model Data

    try {
        const userdata = await OtherUserModel.updateOne({ pnr: pnr }, { $set: { "passengerdetails.$[elem].status": "Failed" } }, {
            arrayFilters: [{ "elem.status": "Pending" }]
        })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Trip Booked Seat Details ${error.message}` })
    }


    const paymentdetails = await PaymentModel.find({ pnr: pnr })
    paymentdetails[0].refno = ref,
        paymentdetails[0].method = method,
        paymentdetails[0].paymentstatus = "Failed"
    try {
        await paymentdetails[0].save()

    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update Seat Booking Detail's  ${error.message}` })

    }
    return res.json({ status: "success", message: "Ticket Booking Failed !!" })
})
module.exports = { OtherPaymentRouter }
