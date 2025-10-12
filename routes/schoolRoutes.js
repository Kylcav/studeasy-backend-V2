const express = require("express");
const { createSchool, getSchools, getAvailableStudents } = require("../controllers/schoolController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.post("/", authMiddleware, createSchool);
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["superadmin", "admin"]),
  getSchools
);

module.exports = router;
// Get available students to invite for a class in a school
router.get(
  "/:schoolId/available-students",
  authMiddleware,
  roleMiddleware(["teacher", "admin"]),
  getAvailableStudents
);
