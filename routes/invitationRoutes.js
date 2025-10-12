const express = require("express");
const { getInvitations, acceptInvitation, rejectInvitation } = require("../controllers/invitationController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const router = express.Router();

router.use(authMiddleware);

// Get pending invitations for a student
router.get("/students/:studentId/invitations", roleMiddleware(["student", "admin"]), getInvitations);

// Accept an invitation
router.put("/invitations/:invitationId/accept", roleMiddleware(["student"]), acceptInvitation);

// Reject an invitation
router.put("/invitations/:invitationId/reject", roleMiddleware(["student"]), rejectInvitation);

module.exports = router;
