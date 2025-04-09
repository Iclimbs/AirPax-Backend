require('dotenv').config()
const express = require("express")
const { SeatModel } = require('../model/seat.model')
const { UserModel } = require('../model/user.model')
const { FoodBookingModel } = require('../model/foodbooking.model')
const { TripModel } = require('../model/trip.model')
const ReportRouter = express.Router()

// Getting Sale's Report


ReportRouter.get("/today", async (req, res) => {

    let statisticsCardsData = [
        {
            color: "gray",
            icon: "BanknotesIcon",
            title: "Today's Sales",
            value: "",
        },
        {
            color: "gray",
            icon: "BanknotesIcon",
            title: "Today's Failed Sales",
            value: "",
        },
        {
            color: "gray",
            icon: "BanknotesIcon",
            title: "Today's Refunded Sales",
            value: "",
        },
        {
            color: "gray",
            icon: "ChartBarIcon",
            title: "User Registered Today",
            value: "",
        },
        {
            color: "gray",
            icon: "ChartBarIcon",
            title: "Today's Food Booking During Travelling",
            value: "",
        },
        {
            color: "gray",
            icon: "ChartBarIcon",
            title: "Successful Payment",
            value: "",
        },
        {
            color: "gray",
            icon: "ChartBarIcon",
            title: "Failed Payment",
            value: "",
        },
        {
            color: "gray",
            icon: "ChartBarIcon",
            title: "Refunded Payment",
            value: "",
        },

    ];

    // Geting Total Amount Of Sales Done 
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59    

    const successSales = await SeatModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay },
                "details.status": "Confirmed"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);

    const lifetimeSuccessSales = await SeatModel.aggregate([
        {
            $match: {
                "details.status": "Confirmed"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);



    // Geting Total Amount Of Sales Failed 
    const lifetimeFailedSales = await SeatModel.aggregate([
        {
            $match: {
                "details.status": "Failed"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);

    // Geting Total Amount Of Sales Failed 
    const failedSales = await SeatModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay },
                "details.status": "Failed"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);


    // Geting Total Amount Of Sales Refunded 
    const refundedSales = await SeatModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay },
                "details.status": "Refunded"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);

    // Geting Total Amount Of Sales Refunded 
    const lifetimeRefundedSales = await SeatModel.aggregate([
        {
            $match: {
                "details.status": "Refunded"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);


    // Geting Total Number Of User's Registered Today 
    const userRegistered = await UserModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay }
            },
        }
    ]);

    // Geting Total Number Of User's Registered Today 

    const unVerified = await UserModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay }
            }
        }
    ]);


    // Total Food Booked Today During Travelling 
    const successFoodSales = await FoodBookingModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay }
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$price" }, // Calculate the sum of the 'price' field
            },
        },
    ]);



    { successSales.length !== 0 ? statisticsCardsData[0].value = `₹ ${successSales[0]?.totalSum}` : statisticsCardsData[0].value = 0 }
    { failedSales.length !== 0 ? statisticsCardsData[1].value = `₹ ${failedSales[0]?.totalSum}` : statisticsCardsData[1].value = 0 }
    { refundedSales.length !== 0 ? statisticsCardsData[2].value = `₹ ${refundedSales[0]?.totalSum}` : statisticsCardsData[2].value = 0 }
    { userRegistered.length !== 0 ? statisticsCardsData[3].value = userRegistered?.length : statisticsCardsData[3].value = 0 }
    { successFoodSales.length !== 0 ? statisticsCardsData[4].value = `₹ ${successFoodSales[0]?.totalSum}` : statisticsCardsData[4].value = 0 }
    { lifetimeSuccessSales.length !== 0 ? statisticsCardsData[5].value = `₹ ${lifetimeSuccessSales[0]?.totalSum}` : statisticsCardsData[5].value = 0 }
    { lifetimeFailedSales.length !== 0 ? statisticsCardsData[6].value = `₹ ${lifetimeFailedSales[0]?.totalSum}` : statisticsCardsData[6].value = 0 }
    { lifetimeRefundedSales.length !== 0 ? statisticsCardsData[7].value = `₹ ${lifetimeRefundedSales[0]?.totalSum}` : statisticsCardsData[7].value = 0 }
    return res.json({ status: "success", data: statisticsCardsData })
})

ReportRouter.get("/sales/daily", async (req, res) => {
    // Params :- req.query.date format :- YYYY-MM-DD
    // Url :- http://localhost:4500/api/v1/report/sales/daily?date=2024-11-21
    let startOfDay;
    let endOfDay;
    if (req.query.date) {
        startOfDay = new Date(req.query.date);
        startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
        endOfDay = new Date(req.query.date);
        endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59    
    } else {
        startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0); // Set time to 00:00:00
        endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999); // Set time to 23:59:59    
    }
    const todayResult = await SeatModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfDay, $lte: endOfDay },
                "details.status": "Confirmed"
            },
        },
        {
            $group: {
                _id: null, // No grouping key
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
    ]);
    if (todayResult.length > 0) {
        return res.json({ status: "success", data: todayResult })
    } else {
        return res.json({ status: "error", message: "No Data Found On The Particular Date" })

    }

})

ReportRouter.get("/sales/weekly", async (req, res) => {
    // Params :- req.query.from  format :- YYYY-MM-DD && req.query.to  format :- YYYY-MM-DD
    // ?from=2024-11-13&to=2024-11-20
    // Url :- http://localhost:4500/api/v1/report/sales/weekly?from=2024-11-13&to=2024-11-21


    let endOfToday;
    let startOfWeek;

    if (req.query.from && req.query.to) {
        endOfToday = new Date(req.query.to);
        endOfToday.setHours(23, 59, 59, 999); // End of today
        startOfWeek = new Date(req.query.from);
        startOfWeek.setHours(0, 0, 0, 0); // Start of the day 7 days ago
    } else {
        endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // End of today
        startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7); // 7 days back
        startOfWeek.setHours(0, 0, 0, 0); // Start of the day 7 days ago
    }
    const result = await SeatModel.aggregate([
        {
            $match: {
                CreatedAt: { $gte: startOfWeek, $lte: endOfToday },
                "details.status": "Confirmed"
            },
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$CreatedAt" } }, // Group by day
                totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
            },
        },
        { $sort: { _id: 1 } }, // Sort by date in ascending order
    ]);
    if (result.length > 0) {
        return res.json({ status: "success", data: result })
    } else {
        return res.json({ status: "error", message: "No Data Found Between Following Dates" })
    }
})

ReportRouter.post("/sales/custom", async (req, res) => {
    const { from, to, status, monthname } = req.body;

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const now = new Date();

    let start;
    let end;

    if (monthname) {
        const monthindex = month.indexOf(monthname)
        start = new Date(now.getFullYear(), monthindex, 1);
        end = new Date(now.getFullYear(), monthindex + 1, 0);
    }

    if (from && to) {
        end = new Date(to);
        end.setHours(23, 59, 59, 999); // End of today
        start = new Date(from);
        start.setHours(0, 0, 0, 0); // Start of the day
    }
    try {
        const result = await SeatModel.aggregate([
            {
                $match: {
                    CreatedAt: { $gte: start, $lte: end },
                    "details.status": status
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$CreatedAt" } }, // Group by day
                    totalSum: { $sum: "$details.amount" }, // Calculate the sum of the 'price' field
                    records: {
                        $push: {
                            name: { $concat: ["$details.fname", " ", "$details.lname"] }, // Combine first and last name
                            age: "$details.age", // Include age
                            email: "$details.email", // Assuming "bookedby" is used as email (modify if needed)
                            gender: "$details.gender", // Include gender
                            amount: "$details.amount", // Include amount
                            mobileno: "$details.mobileno"
                        }
                    }

                },
            },
            { $sort: { _id: 1 } }, // Sort by date in ascending order

        ]);
        if (result.length > 0) {
            return res.json({ status: "success", data: result })
        } else {
            return res.json({ status: "error", message: "No Data Found For Following Month" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found ${error.message}` })
    }

})

ReportRouter.post("/group/age/custom", async (req, res) => {
    // Link :- http://localhost:4500/api/v1/report/group/age/custom?from=2024-10-13&to=2024-11-13&status=Confirmed
    // Link :- http://localhost:4500/api/v1/report/group/age/custom?status=Confirmed&month=November

    const { from, to, status, monthname } = req.body;

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const now = new Date();

    let start;
    let end;

    if (monthname) {
        const monthindex = month.indexOf(monthname)
        start = new Date(now.getFullYear(), monthindex, 1);
        end = new Date(now.getFullYear(), monthindex + 1, 0);
    }

    if (from && to) {
        end = new Date(to);
        end.setHours(23, 59, 59, 999); // End of today
        start = new Date(from);
        start.setHours(0, 0, 0, 0); // Start of the day
    }
    try {

        const result = await SeatModel.aggregate([
            {
                $match: {
                    CreatedAt: { $gte: start, $lte: end },
                    "details.status": status
                }
            },
            {
                $bucket: {
                    groupBy: "$details.age", // Field to group by
                    boundaries: [0, 12, 18, 61], // Define age groups: 0-11, 12-17,18-60, 61+
                    default: "Other", // Catch-all for out-of-bound ages
                    output: {
                        ticketsCount: { $sum: 1 }, // Count tickets in each group
                        totalAmount: { $sum: "$details.amount" }, // Sum the ticket prices for each group
                        records: {
                            $push: {
                                name: { $concat: ["$details.fname", " ", "$details.lname"] }, // Combine first and last name
                                age: "$details.age", // Include age
                                email: "$details.email", // Assuming "bookedby" is used as email (modify if needed)
                                gender: "$details.gender", // Include gender
                                amount: "$details.amount", // Include amount
                                mobileno: "$details.mobileno"
                            }
                        }

                    },
                },
            }
        ]);
        console.log("Result",result);
        
        if (result.length > 0) {
            return res.json({ status: "success", data: result })
        } else {
            return res.json({ status: "error", message: "No Data Found For Following Month" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found ${error.message}` })
    }
})

ReportRouter.post("/group/day/custom", async (req, res) => {

    const { from, to, status, monthname } = req.body;

    const now = new Date();

    let start;
    let end;

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


    if (monthname) {
        const monthindex = month.indexOf(monthname)
        start = new Date(now.getFullYear(), monthindex, 1);
        end = new Date(now.getFullYear(), monthindex + 1, 0);
    }

    if (from && to) {
        end = new Date(to);
        end.setHours(23, 59, 59, 999); // End of today
        start = new Date(from);
        start.setHours(0, 0, 0, 0); // Start of the day
    }
    try {
        const result = await SeatModel.aggregate([
            {
                $match: {
                    CreatedAt: { $gte: start, $lte: end },
                    "details.status": status
                }
            },
            {
                $addFields: {
                    dayName: {
                        $switch: {
                            branches: [
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 1] }, then: "Sunday" },
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 2] }, then: "Monday" },
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 3] }, then: "Tuesday" },
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 4] }, then: "Wednesday" },
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 5] }, then: "Thursday" },
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 6] }, then: "Friday" },
                                { case: { $eq: [{ $dayOfWeek: "$CreatedAt" }, 7] }, then: "Saturday" }
                            ],
                            default: "Unknown"
                        }
                    }
                }
            },
            // Step 2: Group by day name and count the total bookings for each day
            {
                $group: {
                    _id: "$dayName",
                    count: { $sum: 1 }, // Count total bookings
                    totalAmount: { $sum: "$details.amount" } // Sum the ticket amounts

                }
            },
            // Step 3: Sort by day name in ascending order (or by count if desired)
            {
                $sort: { _id: 1 } // Alphabetical order of days
            }
        ])
        if (result.length > 0) {
            return res.json({ status: "success", data: result })
        } else {
            return res.json({ status: "error", message: "No Data Found For Following Month" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found ${error.message}` })

    }
})

ReportRouter.post("/group/platform/custom", async (req, res) => {
    const { from, to, status, monthname } = req.body;

    const now = new Date();

    let start;
    let end;

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


    if (monthname) {
        const monthindex = month.indexOf(monthname)
        start = new Date(now.getFullYear(), monthindex, 1);
        end = new Date(now.getFullYear(), monthindex + 1, 0);
    }

    if (from && to) {
        end = new Date(to);
        end.setHours(23, 59, 59, 999); // End of today
        start = new Date(from);
        start.setHours(0, 0, 0, 0); // Start of the day
    }

    try {
        const result = await SeatModel.aggregate([
            // Step 1: Match by Ticket Status & Start & End Time 
            {
                $match: {
                    CreatedAt: { $gte: start, $lte: end },
                    "details.status": status
                }
            },

            // Step 1: Group by platform and count the bookings
            {
                $group: {
                    _id: "$platform",
                    totalBookings: { $sum: 1 }
                }
            },
            // Step 2: Calculate the total number of bookings across all platforms
            {
                $group: {
                    _id: null,
                    platforms: { $push: { platform: "$_id", totalBookings: "$totalBookings" } },
                    totalSales: { $sum: "$totalBookings" }
                }
            },
            // Step 3: Calculate the percentage contribution for each platform
            {
                $unwind: "$platforms"
            },
            {
                $project: {
                    _id: "$platforms.platform",
                    totalBookings: "$platforms.totalBookings",
                    percentage: {
                        $multiply: [{ $divide: ["$platforms.totalBookings", "$totalSales"] }, 100]
                    }
                }
            },
            // Step 4: Sort by total bookings
            {
                $sort: { totalBookings: -1 }
            }
        ]);
        if (result.length > 0) {
            return res.json({ status: "success", data: result })
        } else {
            return res.json({ status: "error", message: "No Data Found For Following Month" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found ${error.message}` })

    }

})


ReportRouter.post("/group/utilisation/trip", async (req, res) => {

    const { from, to, monthname, startdate, enddate } = req.body;
    const now = new Date();

    let start;
    let end;

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


    if (monthname) {
        const monthindex = month.indexOf(monthname)
        start = new Date(now.getFullYear(), monthindex, 1);
        end = new Date(now.getFullYear(), monthindex + 1, 0);
    }

    if (startdate && enddate) {
        end = new Date(enddate);
        start = new Date(startdate);
    }
    try {
        const result = await TripModel.aggregate([
            {
                $addFields: {
                    parsedDate: { $toDate: "$journeystartdate" } // Convert string to Date
                }
            },
            {
                $match: {
                    parsedDate: {
                        $gte: new Date(start), // Start of range
                        $lte: new Date(end)  // End of range
                    },
                    from: from,
                    to: to
                }
            },
            // Step 1: Project relevant fields and calculate capacity utilization
            {
                $project: {
                    name: 1,
                    journeystartdate: 1,
                    starttime:1,
                    tripId: 1, // Assuming each trip has a unique identifier field
                    totalseats: 1, // Total seats available for the trip
                    bookedseats: 1, // Number of seats booked for the trip
                    capacityUtilization: {
                        $cond: {
                            if: { $gt: ["$totalseats", 0] }, // Ensure totalSeats > 0 to avoid division by zero
                            then: { $multiply: [{ $divide: ["$bookedseats", "$totalseats"] }, 100] }, // Calculate utilization as a percentage
                            else: 0
                        }
                    }
                }
            },
        ])
        if (result.length > 0) {
            return res.json({ status: "success", data: result })
        } else {
            return res.json({ status: "error", message: "No Data Found For Following Parameters" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found ${error.message}` })
    }
})

module.exports = { ReportRouter }