const express = require("express");
const {
  registerUser,
  loginUser,
 
} = require("../controllers/authController");
const router = express.Router();

router.post("/register", registerUser); // User registration
router.post("/login", loginUser); // User login with default password


module.exports = router;
