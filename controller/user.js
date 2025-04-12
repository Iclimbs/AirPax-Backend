require('dotenv').config()
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator')
const express = require("express")
const { oauth2client } = require("../service/googleConfig");
const { UserModel } = require("../model/user.model");
const { RegistrationAuthentication } = require('../middleware/Registration');
const { UserAuthentication } = require('../middleware/Authentication');
const { AdminAuthentication } = require('../middleware/Authorization');
const { transporter } = require('../service/transporter');
const { ObjectId } = require('mongodb');
const userRouter = express.Router()
const ejs = require("ejs")
const path = require('node:path');
const crypt = require("crypto");
const hash = {
    sha256: (data) => {
        return crypt.createHash("sha256").update(data).digest("hex");
    },
    sha512: (data) => {
        return crypt.createHash("sha512").update(data).digest("hex");
    },
    md5: (data) => {
        return crypt.createHash("md5").update(data).digest("hex");
    },
};

// Web

// Login 

// Regular User Login 

userRouter.post("/login", async (req, res) => {
    try {
        const { phoneno, password } = req.body
        const userExists = await UserModel.find({ phoneno })
        if (userExists.length === 0) {
            return res.json({ status: "error", message: "No User Exists With This PhoneNo", redirect: "/user/register" })
        } else {
            if (userExists[0].verified.phone === false) {
                return res.json({ status: "error", message: "Please Verify Your Phone No First", token: userExists[0].signuptoken, redirect: "/user/otp-verification" })
            } else if (hash.sha256(password) === userExists[0].password) {
                if (userExists[0].accounttype === "guest" || userExists[0].accounttype === "user") {
                    let token = jwt.sign({
                        _id: userExists[0]._id, name: userExists[0].name, email: userExists[0].email, phoneno: userExists[0].phoneno, exp: Math.floor(Date.now() / 1000) + (7 * 60 * 60)
                    }, "Authentication")
                    return res.json({ status: "success", message: "Login Successful", token: token, type: "user" })
                } else {
                    return res.json({ status: "error", message: "You cannot login using Admin Credentials !!" })
                }
            } else if (hash.sha256(password) !== userExists[0].password) {
                return res.json({ status: "error", message: "Wrong Password Please Try Again" })
            }
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Login ${error.message}` })
    }
})

userRouter.get("/login/guest", async (req, res) => {
    try {
        const userExists = await UserModel.find({ accounttype: "guest" })
        let token = jwt.sign({
            _id: userExists[0]._id, name: userExists[0].name, email: userExists[0].email, phoneno: userExists[0].phoneno, exp: Math.floor(Date.now() / 1000) + (1 * 60 * 60)
        }, "Authentication")
        return res.json({ status: "success", message: "Login Successful", token: token, type: "Guest" })
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Login ${error.message}` })
    }
})


userRouter.post("/login/admin", async (req, res) => {
    try {
        const { phoneno, password } = req.body
        const userExists = await UserModel.find({ phoneno })
        if (userExists[0].disabled === true) {
            return res.json({ status: "error", message: "Your Account has been Temporarily disabled" })
        }
        if (userExists.length === 0) {
            return res.json({ status: "error", message: "No Admin User Exists Please Contact Your Developer" })
        } else {
            if (userExists[0].accounttype !== "admin" && userExists[0].accounttype !== "Mt's" && userExists[0].accounttype !== "supervisor" && userExists[0].accounttype !== "hr" && userExists[0].accounttype !== "agra-lounge") {
                return res.json({ status: "error", message: "Please Leave This Site You Don't Have Required Access" })
            } else if (hash.sha256(password) === userExists[0].password) {
                let token = jwt.sign({
                    _id: userExists[0]._id, name: userExists[0].name, email: userExists[0].email, accounttype: userExists[0].accounttype, phoneno: userExists[0].phoneno, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
                }, "Authorization")
                return res.json({ status: "success", message: "Login Successful", token: token, type: userExists[0].accounttype })
            } else if (hash.sha256(password) != userExists[0].password) {
                return res.json({ status: "error", message: "Wrong Password Please Try Again" })
            }
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Admin Login ${error.message}` })
    }
})


// User Registration Step 1 Basic Detail's Registration

userRouter.post("/register", async (req, res) => {
    try {
        const { name, email, phoneno } = req.body
        const userExists = await UserModel.find({ phoneno })
        if (userExists.length >= 1) {
            return res.json({ status: "error", message: "User Already Exists with this Phone Number. Please Try another Phone No", redirect: "/user/login" })
        } else {
            const user = new UserModel({
                name,
                email,
                phoneno,
                signuptoken: jwt.sign({ name: name, email: email, phoneno: phoneno, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) }, "Registration"),
                otp: otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false }),
                password: null
            })
            try {
                await user.save()
            } catch (error) {
                return res.json({ status: "error", message: `Failed To Register User ${error.message}` })
            }
            fetch(`https://2factor.in/API/V1/${process.env.twofactorkey}/SMS/${user.phoneno}/${user.otp}/Airpax`)
                .then((response) => response.json())
                .then((data) => {
                    if (data.status === 'Success') {
                        return res.json({ status: "success", message: "User Registration Successful. Please Check Your Phone For OTP", redirect: "/user/otp-verification", token: user.signuptoken })
                    } else {
                        return res.json({ status: "error", message: "User Registration UnSuccessful. Failed to Send OTP. PLease Try again Aftersome Time", redirect: "/user/otp-verification", token: user.signuptoken })
                    }
                    // data.Status === 'Success' ?
                });
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in User Registration ${error}` })
    }
})

// User Registration Step 2 Otp Verification For Phone No

userRouter.post("/otp/verification", RegistrationAuthentication, async (req, res) => {
    const signuptoken = req.headers.authorization.split(" ")[1]
    try {
        const { otp } = req.body
        if (otp.length !== 6) {
            return res.json({ status: "error", message: "Otp Must Of 6 Digit's in Length " })
        }
        const user = await UserModel.find({ signuptoken: signuptoken, otp: otp })
        user[0].verified.phone = true;
        user[0].otp = null;
        try {
            await user[0].save()
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Update User Detail's ${error.message}` })
        }
        if (user.length >= 1 && user[0].password !== null) { // Password Already Created By the User
            let token = jwt.sign({
                _id: user[0]._id, name: user[0].name, email: user[0].email, phoneno: user[0].phoneno, exp: Math.floor(Date.now() / 1000) + (60 * 60)
            }, "Authentication")
            return res.json({ status: "success", message: "Otp Verification Successful", token: token, redirect: "/" })
        } else if (user.length >= 1 && user[0].password == null) {
            return res.json({ status: "success", message: "Otp Verification Successful", redirect: "/user/create-password" })
        } else if (user.length === 0) {
            return res.json({ status: "error", message: "No User Found For OTP Verification", })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Your Otp Verification is Unsuccessful. ${error.message}` })
    }
})

// User Registration Step 2.1 Resend OTP 
userRouter.get("/otp/resend", RegistrationAuthentication, async (req, res) => {
    const signuptoken = req.headers.authorization.split(" ")[1]
    try {
        const user = await UserModel.find({ signuptoken: signuptoken })
        fetch(`https://2factor.in/API/V1/${process.env.twofactorkey}/SMS/${user[0].phoneno}/${user[0].otp}/Airpax`)
            .then((response) => response.json())
            .then((data) => {
                if (data.status === 'Success') {
                    return res.json({ status: "success", message: "Please Check Your Phone For OTP" })
                } else {
                    return res.json({ status: "error", message: "Failed to Send OTP. PLease Try again Aftersome Time" })
                }
                // data.Status === 'Success' ?
                //     res.json({ status: "success", message: "Please Check Your Phone For OTP" })
                //     : res.json({ status: "error", message: "Failed to Send OTP. PLease Try again Aftersome Time" })
            });
    } catch (error) {
        return res.json({ status: "error", message: `Unable To Send OTP ${error.message}` })
    }
})

// User Registration Step 3 Create Password 
userRouter.post("/password/create", RegistrationAuthentication, async (req, res) => {
    const signuptoken = req.headers.authorization.split(" ")[1]
    try {
        const { password, cnfpassword } = req.body
        if (password === cnfpassword) {
            const user = await UserModel.find({ signuptoken: signuptoken })
            if (user.length >= 1 && user[0].verified.phone == true) {
                user[0].password = hash.sha256(password)
                user[0].signuptoken = null
                try {
                    await user[0].save()
                } catch (error) {
                    return res.json({ status: "error", message: "Unable To Set Password For User", redirect: "/" })
                }
                let token = jwt.sign({
                    _id: user[0]?._id, name: user[0]?.name, email: user[0]?.email, phoneno: user[0]?.phoneno, exp: Math.floor(Date.now() / 1000) + (60 * 60)
                }, "Authentication")
                return res.json({ status: "success", message: "Login Successful", token: token, redirect: "/" })
            } else {
                return res.json({ status: "error", message: "No User Found With This Token ID", redirect: "/" })
            }
        } else {
            return res.json({ status: "error", message: "Password & Confirm Password Doesn't Match" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Password Creation ${error.message}` })
    }
})


// Forgot Password Step 1 Sending Otp in Email

userRouter.post("/forgot", async (req, res) => {
    try {
        const { phoneno } = req.body
        const userExists = await UserModel.find({ phoneno })
        if (userExists.length === 0) {
            return res.json({ status: "error", message: "No User Exists Please SignUp First", redirect: "/user/register" })
        } else {
            let newotp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
            let forgotpasswordtoken = jwt.sign({ name: userExists[0].name, email: userExists[0].email, phoneno: userExists[0].phoneno, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, "Registration");
            let link = `${process.env.domainurl}${newotp}/${forgotpasswordtoken}`
            userExists[0].otp = newotp;
            userExists[0].forgotpasswordtoken = forgotpasswordtoken
            try {
                await userExists[0].save()
            } catch (error) {
                return res.json({ status: "error", message: "Failed To Save User New OTP", redirect: "/" })
            }
            let forgotPasswordtemplate = path.join(__dirname, "../emailtemplate/forgotPassword.ejs")
            ejs.renderFile(forgotPasswordtemplate, { link: link }, function (err, template) {
                if (err) {
                    return res.json({ status: "error", message: err.message })
                } else {
                    const mailOptions = {
                        from: process.env.emailuser,
                        to: `${userExists[0].email}`,
                        subject: 'Otp To Reset Password ',
                        html: template
                    }
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            return res.json({ status: "error", message: 'Failed to send email', redirect: "/" });
                        } else {
                            return res.json({ status: "success", message: 'Please Check Your Email', redirect: "/" });
                        }
                    })
                }
            })

        }
    }
    catch (error) {
        return res.json({ status: "error", message: `Error Found in Forgot Password ${error.message}` })
    }
})


// New Password Created By the User Step 2 Storing New Password 


userRouter.post("/password/change", async (req, res) => {
    const { otp } = req.headers
    const token = req.headers.authorization.split(" ")[1]
    try {
        const { password, cnfpassword } = req.body
        if (password === cnfpassword) {
            const user = await UserModel.find({ forgotpasswordtoken: token, otp: otp })
            if (user.length >= 1) { // Removed  (&& user[0].verified.phone == true)
                user[0].password = hash.sha256(password)
                user[0].forgotpasswordtoken = null
                user[0].otp = null
                try {
                    await user[0].save()
                    return res.json({ status: "success", message: "Password Changed Successfully Please Login Now !!", redirect: "/user/login" })
                } catch (error) {
                    return res.json({ status: "error", message: "Unable To Reset Your Password Please Try Again ", redirect: "/user/login" })
                }
            } else {
                return res.json({ status: "error", message: "No User Found ", redirect: "/user/login" })
            }
        } else {
            return res.json({ status: "error", message: "Password & Confirm Password Doesn't Match" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Changing Password  ${error.message}` })
    }
})



// Mobile


// Send New Otp in the User To Initiate Password Change in User.

// Module to Send Otp on Phone

// userRouter.post("/forgot/phone", async (req, res) => {
//     try {
//         const { phoneno } = req.body
//         const userExists = await UserModel.find({ phoneno })
//         if (userExists.length === 0) {
//             return res.json({ status: "error", message: "No User Exists Please SignUp First", redirect: "/user/register" })
//         } else {
//             let newotp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
//             let forgotpasswordtoken = jwt.sign({ name: userExists[0].name, email: userExists[0].email, phoneno: userExists[0].phoneno, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, "Registration");
//             userExists[0].otp = newotp;
//             userExists[0].forgotpasswordtoken = forgotpasswordtoken
//             try {
//                 await userExists[0].save()
//             } catch (error) {
//                 return res.json({ status: "error", message: "Failed To Save User New OTP", redirect: "/" })
//             }
//             fetch(`https://2factor.in/API/V1/${process.env.twofactorkey}/SMS/${userExists[0].phoneno}/${userExists[0].otp}/Airpax`)
//                 .then((response) => response.json())
//                 .then((data) => {
//                     data.Status === 'Success' ?
//                         res.json({ status: "success", message: "Please Check Your Phone For OTP", redirect: "/user/otp-verification", token: userExists[0].forgotpasswordtoken })
//                         : res.json({ status: "error", message: "Failed to Send OTP. PLease Try again Aftersome Time", redirect: "/" })
//                 });
//         }
//     }
//     catch (error) {
//         res.json({ status: "error", message: `Error Found in Login Section ${error.message}` })
//     }
// })

// Module to Send Otp on Email

userRouter.post("/forgot/phone", async (req, res) => {
    try {
        const { phoneno } = req.body
        const userExists = await UserModel.find({ phoneno })
        if (userExists.length === 0) {
            return res.json({ status: "error", message: "No User Exists Please SignUp First", redirect: "/user/register" })
        } else {
            let newotp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
            let forgotpasswordtoken = jwt.sign({ name: userExists[0].name, email: userExists[0].email, phoneno: userExists[0].phoneno, exp: Math.floor(Date.now() / 1000) + (60 * 15) }, "Registration");
            userExists[0].otp = newotp;
            userExists[0].forgotpasswordtoken = forgotpasswordtoken
            try {
                await userExists[0].save()
            } catch (error) {
                return res.json({ status: "error", message: "Failed To Save User New OTP", redirect: "/" })
            }
            let forgotPasswordtemplate = path.join(__dirname, "../emailtemplate/forgotPasswordmobile.ejs")
            ejs.renderFile(forgotPasswordtemplate, { otp: newotp }, function (err, template) {
                if (err) {
                    return res.json({ status: "error", message: err.message })
                } else {
                    const mailOptions = {
                        from: process.env.emailuser,
                        to: `${userExists[0].email}`,
                        subject: 'Otp To Reset Password.',
                        html: template
                    }
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.log(error);
                            return res.json({ status: "error", message: 'Failed to send email', redirect: "/" });
                        } else {
                            return res.json({ status: "success", message: 'Please Check Your Email', redirect: "/", token: forgotpasswordtoken });
                        }
                    })
                }
            })

        }
    }
    catch (error) {
        return res.json({ status: "error", message: `Error Found in Login Section ${error.message}` })
    }
})

// New Otp Verification For the User to Change Password.

userRouter.post("/forgot/otp/verification", async (req, res) => {
    const forgotpasswordtoken = req.headers.authorization.split(" ")[1]
    try {
        const { otp } = req.body
        const userExists = await UserModel.find({ forgotpasswordtoken: forgotpasswordtoken, otp: otp })
        if (userExists.length === 0) {
            return res.json({ status: "error", message: "Otp Verification Failed", })
        } else {
            try {
                userExists[0].otp = null;
                await userExists[0].save
                return res.json({ status: "success", message: "Otp Verification Successful", })
            } catch (error) {
                return res.json({ status: "error", message: "Failed to Verifiy Otp", })
            }
        }
    }
    catch (error) {
        return res.json({ status: "error", message: `Error Found in Otp Verification For Mobile User's ${error.message}` })
    }
})

// Setting New Password For the User's in Phone .

userRouter.post("/forgot/password/change", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    try {
        const { password, cnfpassword } = req.body
        if (password === cnfpassword) {
            const user = await UserModel.find({ forgotpasswordtoken: token })
            if (user.length >= 1) {
                try {
                    user[0].password = hash.sha256(password)
                    user[0].forgotpasswordtoken = null
                    user[0].verified.email == true
                    await user[0].save()
                    return res.json({ status: "success", message: "Password Changed Successfully Please Login Now !!", redirect: "/user/login" })
                } catch (error) {
                    return res.json({ status: "error", message: "You Haven't Made a request to Change Password", redirect: "/user/login" })
                }
            } else {
                return res.json({ status: "error", message: "User Not Found !! Token Expired", redirect: "/user/login" })
            }
        } else {
            return res.json({ status: "error", message: "Password & Confirm Password Doesn't Match" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Creating New Password  ${error.message}` })
    }
})



// Common 

// Getting Basic User Detail's Like username, email & more which is passed via token

userRouter.get("/me", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    try {
        if (!token) {
            return res.json({ status: "error", message: "Please Login to Access User Detail's", redirect: "/user/login" })
        } else {
            const decoded = jwt.verify(token, 'Authentication')
            const user = await UserModel.find({ _id: decoded._id })
            return res.json({ status: "success", message: "Getting User Details", user: user[0] })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Login Section ${error.message}` })
    }
})

// Getting Basic Admin User Detail's Like username, email & more which is passed via token

userRouter.get("/admin/me", AdminAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    try {
        if (!token) {
            return res.json({ status: "error", message: "Please Login to Access User Detail's", redirect: "/user/login" })
        } else {
            const decoded = jwt.verify(token, 'Authorization')
            const user = await UserModel.find({ _id: decoded._id }, { password: 0, CreatedAt: 0 })
            return res.json({ status: "success", data: user[0] })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in Login Section ${error.message}` })
    }
})


// Getting List of All the User's Registered In the Database

userRouter.get("/listall", AdminAuthentication, async (req, res) => {
    try {
        const user = await UserModel.find({}, { password: 0, otp: 0, signuptoken: 0, forgotpasswordtoken: 0 })
        return res.json({ status: "success", data: user })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get User List" })
    }
})

// Getting Detail of a particular user Registered in the Database

userRouter.get("/detailone/:id", async (req, res) => {
    try {
        const user = await UserModel.find({ _id: req.params.id }, { password: 0, otp: 0, signuptoken: 0, forgotpasswordtoken: 0 })
        return res.json({ status: "success", data: user })
    } catch (error) {
        return res.json({ status: "error", message: "Failed to get User Detail's" })
    }
})

// Updating User Detail's in the Database.

userRouter.patch("/me/update", UserAuthentication, async (req, res) => {
    const token = req.headers.authorization.split(" ")[1]
    const decoded = jwt.verify(token, 'Authentication')
    const updateData = req.body
    try {
        const updatedUser = await UserModel.findByIdAndUpdate({ _id: decoded._id }, updateData)
        return res.json({ status: "success", message: "User Details Updated" })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update User Detail's  ${error.message}` })
    }
})


// Register With Google 

userRouter.get("/register/google", async (req, res) => {
    try {
        const { code } = req.query;
        const googleRes = await oauth2client.getToken(code);
        oauth2client.setCredentials(googleRes.tokens);
        const googleresponse = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`)
        const result = await googleresponse.json()
        const { email, name, picture } = result;
        let user = await UserModel.findOne({ email });
        if (!user) {
            user = new UserModel({ name, email, picture, accounttype: "user", verified: { email: true } });
            const userDetails = await user.save()
            const id = userDetails._id;
            let token = jwt.sign({ _id: id.toHexString(), name: user.name, email: user.email, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }, "Authentication")
            return res.json({ status: "success", message: "Registration Successful", token: token, type: "user" })
        } else {
            let token = jwt.sign({ _id: user._id, name: user.name, email: user.email, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }, "Authentication")
            return res.json({ status: "success", message: "Login Successful", token: token, type: "user" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in User Registration ${error}` })
    }
})

// Register With Google In App 

userRouter.post("/register/google/app", async (req, res) => {
    const { name, email, picture } = req.body
    try {
        let user = await UserModel.findOne({ email });
        if (!user) {
            user = new UserModel({ name, email, picture, accounttype: "user", verified: { email: true } });
            const userDetails = await user.save()
            const id = userDetails._id;
            let token = jwt.sign({ _id: id.toHexString(), name: user.name, email: user.email, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }, "Authentication")
            return res.json({ status: "success", message: "Registration Successful", token: token, type: "user" })
        } else {
            let token = jwt.sign({ _id: user._id, name: user.name, email: user.email, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) }, "Authentication")
            return res.json({ status: "success", message: "Login Successful", token: token, type: "user" })
        }
    } catch (error) {
        return res.json({ status: "error", message: `Error Found in User Registration ${error}` })
    }
})




// Create Additional Admin User's 
// Routes to Create supervisor & Mt's
// Create Mt's & supervisor Account's

userRouter.post("/create/admin", AdminAuthentication, async (req, res) => {
    const { name, age, gender, phoneno, password, accounttype } = req.body
    const userExists = await UserModel.find({ phoneno })
    if (userExists.length >= 1) {
        return res.json({ status: "error", message: "Account Already Created With This Phone Number" })
    } else {
        try {
            const user = new UserModel({
                name: name,
                age: age,
                phoneno: phoneno,
                gender: gender,
                password: hash.sha256(password),
                accounttype: accounttype,
                "verified.phone": true
            })
            try {
                await user.save()
                return res.json({ status: "success", message: `Admin User Profile Created Successfully` })
            } catch (error) {
                return res.json({ status: "error", message: `Failed To Create Admin User Profile ${error.message}` })
            }
        } catch (error) {
            return res.json({ status: "error", message: `Failed To Create Admin User Profile ${error.message} `, })
        }
    }
})


userRouter.get("/admin/listall", AdminAuthentication, async (req, res) => {
    try {
        const user = await UserModel.find({
            accounttype: { $in: ["supervisor", "Mt's", "hr","agra-lounge"] }
        })
        return res.json({ status: "success", data: user })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get User List" })
    }
})

userRouter.get("/admin/listall/driver", async (req, res) => {
    try {
        const user = await UserModel.find({
            accounttype: "supervisor",
            disabled:false
        }, { password: 0, CreatedAt: 0 })
        return res.json({ status: "success", data: user })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get User List" })
    }
})

userRouter.get("/admin/listall/conductor", async (req, res) => {
    try {
        const user = await UserModel.find({
            accounttype: "Mt's",
            disabled:false
        }, { password: 0, CreatedAt: 0 })
        return res.json({ status: "success", data: user })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Get User List" })
    }
})

userRouter.patch("/admin/update/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params
    const updateData = req.body
    try {
        const updatedUser = await UserModel.findByIdAndUpdate({ _id: id }, updateData)
        return res.json({ status: "success", message: "User Details Updated" })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update User Detail's  ${error.message}` })
    }
})

userRouter.post("/admin/update/password/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params
    const { password, cnfpassword } = req.body
    if (password !== cnfpassword) {
        return res.json({ status: "error", message: `Password & Confirm Password Must Be Equal` })
    }
    try {
        const updatedUser = await UserModel.find({ _id: id })
        updatedUser[0].password = hash.sha256(password)
        await updatedUser[0].save()
        return res.json({ status: "success", message: "User Details Updated" })
    } catch (error) {
        return res.json({ status: "error", message: `Failed To Update User Detail's  ${error.message}` })
    }
})

userRouter.patch("/admin/disable/:id", AdminAuthentication, async (req, res) => {
    const { id } = req.params
    try {
        const user = await UserModel.findById({ _id: id })
        user.disabled = !user.disabled
        await user.save()
        return res.json({ status: "success", message: "Admin User Status Successfully Updated !!" })
    } catch (error) {
        return res.json({ status: "error", message: "Failed To Update Admin User Status" })
    }
})


module.exports = { userRouter }