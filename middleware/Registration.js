const jwt = require('jsonwebtoken')
const RegistrationAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Registration')
            next()
        } catch (error) {
            return res.json({ status: "error", message: "Registration Token Expired. Please Register Again" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}


module.exports = {
    RegistrationAuthentication
}