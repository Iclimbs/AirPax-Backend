require('dotenv').config()
const express = require("express")
const generateUniqueId = require('generate-unique-id');
const { SeatModel } = require("../../model/seat.model")
const { OtherUserModel } = require("../../model/Other.seat.model");
const { PaymentModel } = require('../../model/payment.model');
const OtherSeatRouter = express.Router()

OtherSeatRouter.post("/selectedseats", async (req, res) => {
    const { PrimaryUser, PassengerDetails, TripId, BookingRefId, Amount } = req.body
    const ticketpnr = generateUniqueId({
        length: 10,
        useLetters: true,
        useNumbers: true
    }).toUpperCase()
    let seats = [] // All the Seats Passenger Detail's For Which User is Applying to Book 
    let seatdetails = [] // All the Details of the Passenger's 

    for (let index = 0; index < PassengerDetails.length; index++) {
        seats.push(PassengerDetails[index].SeatNo)
        seatdetails.push({
            seatNumber: PassengerDetails[index].SeatNo, isLocked: true, tripId: TripId, bookedby: PrimaryUser.PhoneNo,
            expireAt: Date.now() + 15 * 60 * 1000, // Lock for 15 minutes
            pnr: ticketpnr,
            platform: "others",
            details: {
                fname: PassengerDetails[index].Fname,
                lname: PassengerDetails[index].Lname,
                age: PassengerDetails[index].Age,
                gender: PassengerDetails[index].Gender,
                mobileno: PassengerDetails[index].PhoneNo,
                email: PassengerDetails[index].Email.toLowerCase(),
                country: PassengerDetails[index].Country,
                seatno: PassengerDetails[index].SeatNo,
                amount: Math.floor(Amount / PassengerDetails.length),
                refundAmount: 0,
                cancellationReason: "Not Cancelled"

            }
        })
    }
    // const trip = await TripModel.find({ _id: TripId })
    // let bookedseats = trip[0].seatsbooked;
    let bookedseats = [];
    let alreadyexist = false;
    let alreadyexistseats = []; //check the list of Seat's whose seats are already booked. 

    const temporarylockedseats = await SeatModel.find({ tripId: TripId, "details.status": { $nin: ['Refunded', 'Failed'] } }, { seatNumber: 1, _id: 0 })

    for (let index = 0; index < temporarylockedseats.length; index++) {
        bookedseats.push(temporarylockedseats[index].seatNumber)
    }

    for (let index = 0; index < seats.length; index++) {
        if (bookedseats.includes(seats[index])) {
            alreadyexistseats.push(seats[index])
            alreadyexist = true;
        }
    }
    if (alreadyexist) {
        return res.json({ status: "error", message: `Some Seat's Are Already Booked Please Select Any Other Seat`, seats: alreadyexistseats })
    } else {
        const newticket = new OtherUserModel({
            primaryuser: { name: PrimaryUser.Name, phoneno: PrimaryUser.PhoneNo, email: PrimaryUser.Email },
            passengerdetails: PassengerDetails,
            tripId: TripId,
            bookingRefId: BookingRefId,
            amount: Amount,
            pnr: ticketpnr
        })
        try {
            await newticket.save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Save Details ${error.message}` })
        }

        try {
            const result = await SeatModel.insertMany(seatdetails);
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Save Details ${error.message}` })
        }

        const payment = new PaymentModel({
            pnr: ticketpnr,
            userid: PrimaryUser.PhoneNo,
            amount: Amount,
            refundamount: 0
        })

        try {
            await payment.save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Save Details ${error.message}` })
        }

        return res.json({ status: "success", pnr: ticketpnr })
    }
})

module.exports = { OtherSeatRouter }
