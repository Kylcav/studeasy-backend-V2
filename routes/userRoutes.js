const express = require("express");
const {
  getUsers,
  createUser,
  getUser,
  updateUser,
  resetPassword,
  setPassword,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.get("/", authMiddleware, roleMiddleware(["admin"]), getUsers);
router.post("/", authMiddleware, roleMiddleware(["admin"]), createUser); // Admin creates users for a school
router.post("/set-password", setPassword); // First-time password setup (no auth required)
router.get("/:id", authMiddleware, roleMiddleware(["admin", "user"]), getUser); // Get a single user by ID
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "user"]),
  updateUser
); // Update user details
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
