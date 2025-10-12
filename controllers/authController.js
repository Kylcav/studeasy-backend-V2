const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    // Check if user already exists
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Allow schoolId to be null or blank for super_admin and admin
    if ((role === "super_admin" || role === "admin") && !schoolId) {
      req.body.schoolId = null;
    }
    const encryptPassword = await bcrypt.hash(password, 10);
    // Create user (password will be hashed by pre-save hook)
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: encryptPassword,
      role:req.body.role,
      schoolId:req.body.schoolId,
    });
    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// Login a user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!user) {
      console.log("User not found for email:", normalizedEmail);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User found:", user.name, user.email, user.type);
    // Debug: log stored hash only (never log plaintext password)
    console.log("Login attempt for:", normalizedEmail);
    console.log("Stored hash:", user.password);
    console.log("Hash length:", user.password.length);
    console.log("Hash starts with:", user.password.substring(0, 10));
    console.log("Input password length:", password.length);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match result:", isMatch);

    // Additional debug: test with default password if login fails
    if (!isMatch) {
      const isDefaultMatch = await bcrypt.compare("Welcome@123", user.password);
      console.log("Default password match:", isDefaultMatch);
      
      // Test with exact input password
      console.log("Testing with exact input password...");
      const directTest = await bcrypt.compare(password, user.password);
      console.log("Direct password test result:", directTest);
      
      // Check if password might be double-hashed
      if (user.password.length > 80) {
        console.log("WARNING: Password hash is unusually long, might be double-hashed");
        console.log("Hash length:", user.password.length);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, type: user.type, schoolId: user.schoolId },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};
