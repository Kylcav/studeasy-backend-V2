const express = require("express");
const {
  createSubject,
  getSubjects,
  getSubject,
  updateSubject,
  deleteSubject
} = require("../controllers/subjectController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new subject in a class (Teacher only)
router.post("/class/:classId", roleMiddleware(["teacher"]), createSubject);

// Get all subjects for a class
router.get("/class/:classId", roleMiddleware(["teacher", "admin", "student"]), getSubjects);

// Get a single subject by ID
router.get("/:id", roleMiddleware(["teacher", "admin", "student"]), getSubject);

// Update a subject (Teacher who created the class only)
router.put("/:id", roleMiddleware(["teacher"]), updateSubject);

// Delete a subject (Teacher who created the class only)
router.delete("/:id", roleMiddleware(["teacher"]), deleteSubject);

module.exports = router;
