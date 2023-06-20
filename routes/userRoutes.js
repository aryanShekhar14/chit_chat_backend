const express = require("express");
const { registerUser, authUser, allUsers } = require("../controllers/userControllers");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware")

router.route('/').post(registerUser).get(protect, allUsers)//will first go to protect middleware before going to allusers
//As we need auth token to access all users
router.post('/login', authUser)


module.exports = router;