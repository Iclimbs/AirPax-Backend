
const mongoose = require("mongoose");
const vehicleFeatures = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    },
    CreatedAt: { type: Date, default: Date.now },
});
const vehicleFeaturesModel = mongoose.model("VehicleFeatures", vehicleFeatures)
module.exports = { vehicleFeaturesModel };

///vehicle model