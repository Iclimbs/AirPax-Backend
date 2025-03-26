require('dotenv').config()
const express = require("express")
const generateUniqueId = require('generate-unique-id');
const { SeatModel } = require("../model/seat.model")
const { PaymentModel } = require('../model/payment.model');
const SeatRouter = express.Router();
const ccav = require("../payment/ccavutil")
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const path = require('node:path');
const ejs = require("ejs")
const { transporter } = require('../service/transporter');



const { BookingModel } = require('../model/booking.model');
const { TripModel } = require('../model/trip.model');
const { AdminAuthentication } = require('../middleware/Authorization');

const toProperCase = (word) => {
    if (!word) return ''; // Return empty string if input is falsy
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

SeatRouter.post("/selectedseats", async (req, res) => {
    const { userdetails, passengerdetails, tripId, totalamount, platform } = req.body
    // Generating Random Ticket PNR
    const ticketpnr = generateUniqueId({
        length: 10,
        useLetters: true,
        useNumbers: true
    }).toUpperCase()
    let seats = [] // All the Seat Number's for which the using is trying to book ticket. 
    let seatdetails = [] // All the Details of the Passenger's for which seat's are going to be booked.
    // For Loop To Add All the Passenger Detail's in the Seatdetail's Array which can be Added in the Seat Model || Seats Collection 
    for (let index = 0; index < passengerdetails.length; index++) {
        seats.push(passengerdetails[index].seatno)
        seatdetails.push({
            seatNumber: passengerdetails[index].seatno, isLocked: true, tripId: tripId, bookedby: userdetails._id,
            expireAt: Date.now() + 15 * 60 * 1000, // Lock for 15 minutes
            pnr: ticketpnr,
            platform: platform,
            details: {
                fname: toProperCase(passengerdetails[index].fname),
                lname: toProperCase(passengerdetails[index].lname),
                age: passengerdetails[index].age,
                gender: passengerdetails[index].gender,
                seatNo: passengerdetails[index].seatno,
                amount: passengerdetails[index].amount,
                food: passengerdetails[index].food,
                mobileno: passengerdetails[index].mobileno,
                email: passengerdetails[index].email.toLowerCase(),
                refundAmount: 0,
                cancellationReason: "Not Cancelled"
            }
        })
    }

    // Getting List of All The Seat's which are locked (Seat's Can Be Temporary locked for that person untill the payment is complete or the condition which seat is permanently locked after the payment is completed) 
    const temporarylockedseats = await SeatModel.find({ tripId: tripId, "details.status": { $nin: ['Refunded', 'Failed'] } }, { seatNumber: 1, _id: 0 })

    // Step 1 Checking If the User is trying to book those seat's which are already booked & Payment is completed.

    // Getting the list of all the seat's which are already booked.
    let lockedseats = []
    // Setting a default condition to check if the seat which the user is trying to book has already been booked or not.
    let alreadyexist = false;
    // check the list of Seat's whose seats are already booked. So that we can inform the user to change his seat's
    let alreadyexistseats = [];
    // For Loop to get the list of all the seats which are currently locked!!

    for (let index = 0; index < temporarylockedseats.length; index++) {
        lockedseats.push(temporarylockedseats[index].seatNumber)
    }

    // Testing For Commpon Seat Number's in LokedSeats & Alreadyexistseats
    for (let index = 0; index < seats.length; index++) {
        if (lockedseats.includes(seats[index])) {
            alreadyexistseats.push(seats[index])
            alreadyexist = true;
        }
    }

    // res.json({ status: "success" })
    if (alreadyexist) {
        return res.json({ status: "error", message: "Some Seat's Are Already Booked Please Select Any Other Seat", seats: alreadyexistseats })
    } else {
        try {
            const paymentdetails = new PaymentModel({ pnr: ticketpnr, userid: userdetails._id, amount: totalamount, refundamount: 0, })
            await paymentdetails.save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Added Payment Details ${error.message}` })
        }
        try {
            const result = await SeatModel.insertMany(seatdetails);
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Added Seat Details ${error.message}`, data: seatdetails })
        }
        const data = {
            tid: new Date().getTime(),
            merchant_id: process.env.MID,
            order_id: ticketpnr,
            currency: "INR",
            total_amount: totalamount,
            redirect_url: process.env.success_url,
            cancel_url: `https://www.airpax.co/payment/Failure/${ticketpnr}/no_ref/cancelleBbyUser`,
            language: "EN"
        };

        const code = process.env.access_code;
        const workingKey = process.env.Working_key;
        const ccavenueUrl = process.env.url;
        let md5 = crypto.createHash('md5').update(workingKey).digest();
        let keyBase64 = Buffer.from(md5).toString('base64');

        //Initializing Vector and then convert in base64 string
        let ivBase64 = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]).toString('base64');
        let body = `tid=${data.tid}&merchant_id=${data.merchant_id}&order_id=${data.order_id}&amount=${data.total_amount}&currency=INR&redirect_url=${process.env.success_url}&cancel_url=${process.env.failure_url}${data.order_id}&language=EN`

        let encryptedData = ccav.encrypt(body, keyBase64, ivBase64);

        return res.json({
            status: "success",
            data: {
                encryptedData,
                code,
                ccavenueUrl
            }
        });
    }
})

SeatRouter.post("/booking/admin", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authorization')
    const { passengerdetails, tripId, amount } = req.body
    // Generating Random Ticket PNR
    const ticketpnr = generateUniqueId({
        length: 10,
        useLetters: true,
        useNumbers: true
    }).toUpperCase()
    let seats = []; // All the Seat Number's for which the using is trying to book ticket. 
    let seatdetails = []; // All the Details of the Passenger's for which seat's are going to be booked.
    let emails = [];
    // For Loop To Add All the Passenger Detail's in the Seatdetail's Array which can be Added in the Seat Model || Seats Collection 
    for (let index = 0; index < passengerdetails.length; index++) {
        seats.push(passengerdetails[index].seatno)
        seatdetails.push({
            seatNumber: passengerdetails[index].seatno, isLocked: true, isBooked: true, tripId: tripId, bookedby: decoded._id,
            expireAt: null,
            pnr: ticketpnr,
            platform: "Admin",
            details: {
                fname: toProperCase(passengerdetails[index].fname),
                lname: toProperCase(passengerdetails[index].lname),
                age: passengerdetails[index].age,
                gender: passengerdetails[index].gender,
                seatNo: passengerdetails[index].seatno,
                amount: passengerdetails[index].amount,
                food: passengerdetails[index].food,
                mobileno: passengerdetails[index].mobileno,
                email: passengerdetails[index].email.toLowerCase(),
                status: "Confirmed",
                refundAmount: 0,
                cancellationReason: "Not Cancelled"

            }
        })
        if (emails.includes(passengerdetails[index].email.toLowerCase()) == false) {
            emails.push(passengerdetails[index].email.toLowerCase())
        }

    }

    // Getting List of All The Seat's which are locked (Seat's Can Be Temporary locked for that person untill the payment is complete or the condition which seat is permanently locked after the payment is completed) 
    const temporarylockedseats = await SeatModel.find({ tripId: tripId, "details.status": { $nin: ['Refunded', 'Failed'] } }, { seatNumber: 1, _id: 0 })

    // Step 1 Checking If the User is trying to book those seat's which are already booked & Payment is completed.

    // Getting the list of all the seat's which are already booked.
    let lockedseats = []
    // Setting a default condition to check if the seat which the user is trying to book has already been booked or not.
    let alreadyexist = false;
    // check the list of Seat's whose seats are already booked. So that we can inform the user to change his seat's
    let alreadyexistseats = [];
    // For Loop to get the list of all the seats which are currently locked!!

    for (let index = 0; index < temporarylockedseats.length; index++) {
        lockedseats.push(temporarylockedseats[index].seatNumber)
    }

    // Testing For Commpon Seat Number's in LokedSeats & Alreadyexistseats
    for (let index = 0; index < seats.length; index++) {
        if (lockedseats.includes(seats[index])) {
            alreadyexistseats.push(seats[index])
            alreadyexist = true;
        }
    }

    // Creating New Document In Bookign Model To Stored Booking Order Detail's

    // Get Trip Detail's 
    const tripdetails = await TripModel.find({ _id: tripId })
    if (tripdetails.length == 0) {
        return res.json({ status: "error", message: "No Trip Found With This ID" })
    }

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
        pnr: ticketpnr,
        seats: seats,
        userid: decoded._id,
        tripId: tripdetails[0]._id
    })
    // Checking If A booking is already present in Booking Model Or Not
    const bookingExists = await BookingModel.find({ pnr: ticketpnr, userid: decoded._id, tripId: tripdetails[0]._id })

    if (alreadyexist) {
        return res.json({ status: "error", message: "Some Seat's Are Already Booked Please Select Any Other Seat", seats: alreadyexistseats })
    } else {
        // Storing Booking Details After Confirming That No Booking Detail is Present
        if (bookingExists.length === 0) {
            try {
                await BookingDetails.save()
            } catch (error) {
                return res.json({ status: "error", message: `Failed To Save Booking Detail's ${error.message}` })
            }
        }
        // Saving Payment Detail's In Payment Model
        try {
            const paymentdetails = new PaymentModel({ pnr: ticketpnr, userid: decoded._id, amount: amount, paymentstatus: "Confirmed", method: "Cash", refundamount: 0 })
            await paymentdetails.save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Added Payment Details ${error.message}` })
        }
        // Saving Seats Detail's For Which Admin Is Trying to Book Ticket 
        try {
            const result = await SeatModel.insertMany(seatdetails);
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Added Seat Details ${error.message}`, data: seatdetails })
        }

        // Updating Trip Detail's To Confirm Ticket Booking 
        let newbookedseats = seats.concat(tripdetails[0].seatsbooked);

        try {
            tripdetails[0].seatsbooked = newbookedseats;
            tripdetails[0].bookedseats = newbookedseats.length;
            tripdetails[0].availableseats = tripdetails[0].totalseats - newbookedseats.length
            await tripdetails[0].save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Update Trip Booked Seat Details ${error.message}` })
        }
        let confirmpayment = path.join(__dirname, "../emailtemplate/confirmpaymentAdmin.ejs")
        ejs.renderFile(confirmpayment, { user: "Sir/Madam", seat: seatdetails, trip: tripdetails[0], pnr: ticketpnr, amount: amount }, function (err, template) {
            if (err) {
                return res.json({ status: "error", message: err.message })
            } else {
                const mailOptions = {
                    from: process.env.emailuser,
                    to: `${decoded.email}`,
                    cc: `${emails}`,
                    subject: `Booking Confirmation on AIRPAX, Bus: ${tripdetails[0].busid}, ${tripdetails[0].journeystartdate}, ${tripdetails[0].from} - ${tripdetails[0].to}`,
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
    }
})

// Get List of All the Seat's Booked Till Now Only For Admin
SeatRouter.get("/listall", async (req, res) => {
    try {
        const seatlist = await SeatModel.find({})
        return res.json({ status: "success", data: seatlist })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get Booked Ticket List" })
    }
})

// Get List of All the Incoming Seat Bookings From that particular period of TIme Only For the User
SeatRouter.get("/list/booked/incoming", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    try {
        const seatlist = await SeatModel.find({ isBooked: true, bookedby: decoded._id }, {})
        return res.json({ status: "success", data: seatlist })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get Booked Ticket List" })
    }
})

// Get List of All the Seat's Booked Till Now By the User
SeatRouter.get("/list/booked/history", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    try {
        const seatlist = await SeatModel.find({ isBooked: true, bookedby: decoded._id }, { isBooked: 0, isLocked: 0, lockExpires: 0, bookedby: 0 })
        return res.json({ status: "success", data: seatlist })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get Booked Ticket List" })

    }
})



// Get List of All the Detail's Of a particular Seat's Booked By the User
SeatRouter.get("/list/booked/:id", async (req, res) => {
    try {
        const seatlist = await SeatModel.find({})
        return res.json({ status: "success", data: seatlist })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get Booked Ticket List" })

    }
})

SeatRouter.get("/list/passenger/:id", async (req, res) => {
    const { id } = req.params
    try {
        const seatlist = await SeatModel.find({ tripId: id, "details.status": "Confirmed" })
        return res.json({ status: "success", data: seatlist })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get Booked Ticket List" })

    }
})


// Update List Of All Passengers Who Has OnBoarded The Trip 
SeatRouter.patch("/update/onboardedstatus",async(req,res)=>{
    try {
        
    } catch (error) {
        return res.json({status:'error',message:`Failed To Updated Passenger OnBoard Status ${error.message}`})
    }
})
module.exports = { SeatRouter }
