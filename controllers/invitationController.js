const Invitation = require("../models/Invitation");
const Class = require("../models/Class");

// Get pending invitations for a student
exports.getInvitations = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    if (String(req.user._id) !== String(studentId) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const invitations = await Invitation.find({ studentId, status: "pending" })
      .populate({ path: "classId", select: "name description" })
      .populate({ path: "invitedBy", select: "name email" });

    return res.status(200).json({ message: "Invitations fetched", invitations });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching invitations", error: error.message });
  }
};

// Accept invitation
exports.acceptInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const studentId = req.user.id;

    const invite = await Invitation.findById(invitationId);
    if (!invite || String(invite.studentId) !== String(studentId)) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: `Invitation already ${invite.status}` });
    }

    // Add student to class
    await Class.findByIdAndUpdate(invite.classId, { $addToSet: { students: studentId } });

    // Mark invitation as accepted
    invite.status = "accepted";
    await invite.save();

    return res.status(200).json({ message: "Invitation accepted" });
  } catch (error) {
    return res.status(500).json({ message: "Error accepting invitation", error: error.message });
  }
};

// Reject invitation
exports.rejectInvitation = async (req, res) => {
  try {
    const invitationId = req.params.invitationId;
    const studentId = req.user.id;

    const invite = await Invitation.findById(invitationId);
    if (!invite || String(invite.studentId) !== String(studentId)) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invite.status !== "pending") {
      return res.status(400).json({ message: `Invitation already ${invite.status}` });
    }

    // Mark invitation as rejected
    invite.status = "rejected";
    await invite.save();

    return res.status(200).json({ message: "Invitation rejected" });
  } catch (error) {
    return res.status(500).json({ message: "Error rejecting invitation", error: error.message });
  }
};
