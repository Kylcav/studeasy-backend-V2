const express = require("express");
const {
  createClass,
  getClasses,
  getClass,
  updateClass,
  deleteClass,
  inviteStudents,
  getClassStudents,
  removeStudentFromClass,
  getSchoolStudentsWithFlags
} = require("../controllers/classController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new class (Teacher only)
router.post("/", roleMiddleware(["teacher"]), createClass);

// Get classes - unified endpoint (Teachers see their own, Students see assigned, Admins see all)
router.get("/", roleMiddleware(["teacher", "admin", "student"]), getClasses);

// Get a single class by ID
// router.get("/:id", roleMiddleware(["teacher", "admin", "student"]), getClass);

// Update a class (Teacher who created it only)
router.put("/:id", roleMiddleware(["teacher"]), updateClass);

// Delete a class (Teacher who created it only)
router.delete("/:id", roleMiddleware(["teacher"]), deleteClass);

// Invite multiple students to a class (Teacher only)
router.post("/:classId/invite-students", roleMiddleware(["teacher"]), inviteStudents);

// View class students (Teacher/Admin/Student in same school)
router.get(
  "/:classId/students",
  roleMiddleware(["teacher", "admin", "student"]),
  getClassStudents
);

// Get school students with inClass/invited flags for a class (Teacher only)
router.get(
  "/:classId/school-students",
  roleMiddleware(["teacher"]),
  getSchoolStudentsWithFlags
);

// Remove student from class (Teacher only)
router.delete(
  "/:classId/students/:studentId",
  roleMiddleware(["teacher"]),
  removeStudentFromClass
);


module.exports = router;
