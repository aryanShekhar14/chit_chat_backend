const jwt = require('jsonwebtoken')
const User = require("../models/userModel")
const asyncHandler = require("express-async-handler")

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {//we have the token
        try {
            //remove Bearer
            token = req.headers.authorization.split(" ")[1];

            //decode token id
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select("-password");
            next();
        }
        catch (error) {
            res.status(401);
            throw new Error("Sorry, You are not authorized")
        }
    }
    if (!token) {
        res.status(401);
        throw new Error("Sorry, You are not authorized")
    }
});

module.exports = { protect };
