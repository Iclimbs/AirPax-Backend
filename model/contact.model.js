const e = require("express");
const mongoose = require("mongoose");
const contactschema = mongoose.Schema({
    fname: {
        type: String,
        required: true,
    },
    lname: {
        type: String,
        required: true,
    },
    phoneno: {
        type: Number,
        required: true,

    },
    message: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    CreatedAt: { type: Date, default: Date.now },
});
const ContactModel = mongoose.model("Contact", contactschema);
module.exports = { ContactModel };