const express = require("express");
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  resetPassword,
  setPassword,
  deleteUser,
  getSchoolStudents,
  uploadProfileImage,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const { upload } = require("../utils/s3Utils");
const router = express.Router();

router.get("/", authMiddleware, roleMiddleware(["admin"]), getUsers);
router.get("/school/students", authMiddleware, roleMiddleware(["teacher"]), getSchoolStudents); // Teacher gets students from their school
router.post("/", authMiddleware, roleMiddleware(["admin"]), createUser); // Admin creates users for a school
router.post("/set-password", setPassword); // First-time password setup (no auth required)
router.get("/:id", authMiddleware, roleMiddleware(["admin", "user"]), getUser); // Get a single user by ID
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "user","teacher"]),
  updateUser
); // Update user details

// Upload profile image
router.post(
  "/:id/profile-image",
  authMiddleware,
  roleMiddleware(["admin", "user", "teacher"]),
  upload.single('profileImage'),
  uploadProfileImage
); // Upload profile image
router.put(
  "/:id/reset-password",
  authMiddleware,
  roleMiddleware(["admin"]),
  resetPassword
); // Admin resets user password

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteUser
); // Admin deletes user

module.exports = router;
