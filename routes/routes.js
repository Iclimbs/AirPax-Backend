const router = require("express").Router();
const { AgraLounge } = require("../controller/AgraLounge");
const { BlogRouter } = require("../controller/blog");
const { ContactRouter } = require("../controller/contact");
const { CounterRouter } = require("../controller/counter");
const { FoodRouter } = require("../controller/food");
const { FoodBookingRouter } = require("../controller/foodbooking");
const { OtherPaymentRouter } = require("../controller/GMR/otherpayment");
const { OtherSeatRouter } = require("../controller/GMR/otherseat");
const { PaymentRouter } = require("../controller/payment");
const { PaymentGateway } = require("../controller/paymentgateway");
const { PnrRouter } = require("../controller/pnr");
const { ReportRouter } = require("../controller/report");
const { SeatRouter } = require("../controller/seat");
const { SupervisorRouter } = require("../controller/SupervisorReport");
const { TicketRouter } = require("../controller/ticket");
const { tripRouter } = require("../controller/trip");
const { userRouter } = require("../controller/user");
const { validateRouter } = require("../controller/validate");
const { vehicleRouter } = require("../controller/vehicle");
const { FeatureRouter } = require("../controller/vehiclefeatures");

router
    .use("/user", userRouter)
    .use("/vehicle", vehicleRouter)
    .use("/trip", tripRouter)
    .use("/counter", CounterRouter)
    .use("/validate", validateRouter)
    .use("/seat", SeatRouter)
    .use("/payment", PaymentRouter)
    .use("/gateway", PaymentGateway)
    .use("/food", FoodRouter)
    .use("/new/seat/", OtherSeatRouter)
    .use("/new/payment", OtherPaymentRouter)
    .use("/pnr", PnrRouter)
    .use("/ticket", TicketRouter)
    .use("/blog", BlogRouter)
    .use("/features", FeatureRouter)
    .use("/report", ReportRouter)
    .use("/foodbooking", FoodBookingRouter)
    .use("/contact", ContactRouter)
    .use("/agraLounge", AgraLounge)
    .use("/supervisor", SupervisorRouter)


module.exports = router;