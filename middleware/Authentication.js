const jwt = require('jsonwebtoken')
const UserAuthentication = (req, res, next) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(" ")[1]
            const decoded = jwt.verify(token, 'Authentication')
            next()
        } catch (error) {
            return res.json({ status: "error", message: "Authentication Token Expired. Please Login Again", redirect: "/user/login" })
        }
    } else {
        return res.json({ status: "error", message: "No Token Found in Headers." })
    }
}


module.exports = {
    UserAuthentication
}