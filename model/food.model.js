const mongoose = require("mongoose");
const foodschema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: String,
        required: true,
    },
    available: {
        type: Boolean,
        default: true,

    },
    availableAt: {
        type: String,
        enum: ["In Bus", "Agra lounge"],
        default: "In Bus",
        required: true
    },
    CreatedAt: { type: Date, default: Date.now },
});
const FoodModel = mongoose.model("Food", foodschema);
module.exports = { FoodModel };