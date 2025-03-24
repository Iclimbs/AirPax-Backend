require('dotenv').config()
const express = require("express")
const ContactRouter = express.Router();
const ejs = require("ejs")
const path = require('node:path');
const { transporter } = require('../service/transporter');
const { ContactModel } = require('../model/contact.model');

ContactRouter.post("/", async (req, res) => {
    const { fname, lname, email, phoneno, message } = req.body
    let contactData;

    const contact = new ContactModel({ fname, lname, email, phoneno, message });
    try {
        contactData = await contact.save()
    } catch (error) {
        return res.json({ status: 'error', message: `Failed To Save Contact Message ${error.message}` })
    }

    let contactmail = path.join(__dirname, "../emailtemplate/contact.ejs")
    ejs.renderFile(contactmail, { list: contactData }, function (err, template) {
        if (err) {
            return res.json({ status: "error", message: err.message })
        } else {
            const mailOptions = {
                from: process.env.emailuser,
                to: process.env.contactuser,
                subject: `Received New Contact Message From ${fname} ${lname}`,
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


})


module.exports = { ContactRouter }
