const mongoose = require("mongoose");

const itemsSchema = new mongoose.Schema({
    itemsId: {
        type: mongoose.Types.ObjectId,
        ref: "Food",
        required: true
    },
    quantity: {
        type: Number,
        min: 1,
        required: true
    },
    pricePerItem: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const agraLoungeOrderSchema = new mongoose.Schema({
    items: [itemsSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ["cash", "online"],
        required: true
    }
}, { timestamps: true });

const agraLoungeFoodOrders = mongoose.model("agraLoungeFoodOrders", agraLoungeOrderSchema);

module.exports = { agraLoungeFoodOrders };
