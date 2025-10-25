const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { uploadToS3, deleteFromS3 } = require("../utils/s3Utils");

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ message: "Users fetched successfully", users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

// Get a single user by ID
exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate if user ID is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId).select("-password"); // Exclude password field

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Error fetching user",
      error: error.message,
    });
  }
};

// Create a new user (Admin creates teachers/students)
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, schoolId } = req.body;

    // Default password for first-time login (will be hashed by pre-save hook)
    const defaultPassword = "Welcome@123";

    const newUser = new User({
      name,
      email,
      password: defaultPassword, // Let the pre-save hook hash this
      role,
      schoolId,
    });
    await newUser.save();

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// Update user details (profile, name, etc.)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Validate if user ID is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Remove password from updates if present (use separate password update endpoint)
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: "Error updating user",
      error: error.message,
    });
  }
};

// Upload profile image
exports.uploadProfileImage = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Validate if user ID is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile image from S3 if exists
    if (user.profileImage) {
      await deleteFromS3(user.profileImage);
    }

    // Upload new image to S3
    const imageUrl = await uploadToS3(req.file, 'profile-images');

    // Update user with new profile image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      message: "Profile image uploaded successfully",
      user: updatedUser,
      imageUrl: imageUrl
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Error uploading profile image",
      error: error.message,
    });
  }
};

// Reset password - Admin resets user password to default
exports.resetPassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { newPassword } = req.body;

    // Validate if user ID is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Use provided password or default password
    const passwordToSet = newPassword || "Welcome@123";
    
    // Validate password strength
    if (passwordToSet.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Update user password (will be hashed by pre-save hook)
    user.password = passwordToSet;
    await user.save();

    res.status(200).json({
      message: "Password reset successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Error resetting password",
      error: error.message,
    });
  }
};



// Set password - User sets password using email and password, returns token
exports.setPassword = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ 
        message: "Email and password are required" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({ 
        message: "Please provide a valid email address" 
      });
    }

    // Validate password strength
    if (req.body.password.length < 6) {
      return res.status(400).json({ 
        message: "Password must be at least 6 characters long" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        message: "User not found with this email address" 
      });
    }

    console.log("user found:", user.name, user.email, user.role);

    // Check if user has default password (first time setup)
    const isDefaultPassword = await bcrypt.compare("Welcome@123", user.password);
    
    if (isDefaultPassword) {
      // First time password setup
      console.log("First time password setup for:", user.email);
      
      // Update user password (will be hashed by pre-save hook)
      user.password = req.body.password;
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user._id, role: user.role, schoolId: user.schoolId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        message: "Password set successfully for first time login",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    } else {
      // User already has a custom password, verify it
      console.log("Verifying existing password for:", user.password,req.body.password);
      
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      console.log("isPasswordValid",isPasswordValid);

      if (!isPasswordValid) {
        return res.status(401).json({ 
          message: "Invalid password" 
        });
      }

      // Generate JWT token for existing user
      const token = jwt.sign(
        { id: user._id, role: user.role, schoolId: user.schoolId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      });
    }
  } catch (error) {
    console.error("Error in setPassword:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: "Error setting password",
      error: error.message,
    });
  }

};

// Get students from teacher's school (Teacher only)
exports.getSchoolStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can access student lists" 
      });
    }

    // Verify the teacher has a schoolId
    if (!schoolId) {
      return res.status(400).json({ 
        message: "Teacher must be associated with a school" 
      });
    }

    // Get all students from the teacher's school
    const students = await User.find({
      role: "student",
      schoolId: schoolId
    }).select("-password").sort({ name: 1 }); // Sort by name alphabetically

    res.status(200).json({
      message: "Students fetched successfully",
      count: students.length,
      students
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid school ID format" 
      });
    }
    res.status(500).json({
      message: "Error fetching students",
      error: error.message,
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate if user ID is provided
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};
