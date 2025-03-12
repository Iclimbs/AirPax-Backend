const mongoose = require("mongoose");
const userschema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: String
  },
  gender: {
    type: String
  },
  address: {
    type: String
  },
  email: {
    type: String,
  },
  phoneno: {
    type: Number,
  },
  password: {
    type: String
  },
  otp: {
    type: Number
  },
  signuptoken: {
    type: String
  },
  forgotpasswordtoken: {
    type: String
  },
  verified: {
    email: {
      type: Boolean,
      default: false
    },
    phone: {
      type: Boolean,
      default: false
    }
  },
  picture: {
    type: String
  },
  accounttype: {
    type: String,
    enum: ["user", "admin", "supervisor", "Mt's","hr","agra-lounge"], 
    default: "user"
  },
  disabled: {
    type: Boolean,
    default: false
  },
  CreatedAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model("Users", userschema);
module.exports = { UserModel };