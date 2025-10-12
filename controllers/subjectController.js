const Subject = require("../models/Subject");
const Class = require("../models/Class");

// Create a new subject (Teacher only)
exports.createSubject = async (req, res) => {
  try {
    const { title, content, resources } = req.body;
    const classId = req.params.classId;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can create subjects" 
      });
    }

    // Verify the class exists and belongs to the teacher
    const classData = await Class.findOne({
      _id: classId,
      createdBy: teacherId,
      schoolId
    });

    if (!classData) {
      return res.status(404).json({ 
        message: "Class not found or access denied" 
      });
    }

    const newSubject = new Subject({
      title,
      content,
      resources: resources || [],
      classId
    });

    await newSubject.save();

    // Add the subject to the class's subjects array
    await Class.findByIdAndUpdate(
      classId,
      { $push: { subjects: newSubject._id } }
    );

    // Populate the classId field for response
    await newSubject.populate('classId', 'name description');

    res.status(201).json({
      message: "Subject created successfully",
      subject: newSubject
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid class ID format" 
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: "Error creating subject",
      error: error.message
    });
  }
};

// Get all subjects for a class
exports.getSubjects = async (req, res) => {
  try {
    const classId = req.params.classId;
    const schoolId = req.user.schoolId;
    const userRole = req.user.role;

    // Verify the class exists and user has access
    let classQuery = { _id: classId, schoolId };

    // If user is a teacher, only allow access to their own classes
    if (userRole === "teacher") {
      classQuery.createdBy = req.user.id;
    }

    const classData = await Class.findOne(classQuery);

    if (!classData) {
      return res.status(404).json({ 
        message: "Class not found or access denied" 
      });
    }

    const subjects = await Subject.find({ classId })
      .populate('classId', 'name description')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Subjects fetched successfully",
      subjects
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid class ID format" 
      });
    }
    res.status(500).json({
      message: "Error fetching subjects",
      error: error.message
    });
  }
};

// Get a single subject by ID
exports.getSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const schoolId = req.user.schoolId;
    const userRole = req.user.role;

    const subject = await Subject.findById(subjectId)
      .populate('classId', 'name description createdBy schoolId');

    if (!subject) {
      return res.status(404).json({ 
        message: "Subject not found" 
      });
    }

    // Verify access based on user role
    if (userRole === "teacher") {
      // Teacher can only access subjects from their own classes
      if (subject.classId.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ 
          message: "Access denied" 
        });
      }
    } else if (userRole === "student" || userRole === "admin") {
      // Students and admins can access subjects from their school
      if (subject.classId.schoolId.toString() !== schoolId) {
        return res.status(403).json({ 
          message: "Access denied" 
        });
      }
    }

    res.status(200).json({
      message: "Subject fetched successfully",
      subject
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid subject ID format" 
      });
    }
    res.status(500).json({
      message: "Error fetching subject",
      error: error.message
    });
  }
};

// Update a subject (Teacher who created the class only)
exports.updateSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const updates = req.body;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can update subjects" 
      });
    }

    // Find the subject and verify ownership through class
    const subject = await Subject.findById(subjectId)
      .populate('classId', 'createdBy schoolId');

    if (!subject) {
      return res.status(404).json({ 
        message: "Subject not found" 
      });
    }

    // Verify the teacher owns the class
    if (subject.classId.createdBy.toString() !== teacherId || 
        subject.classId.schoolId.toString() !== schoolId) {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.classId;

    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      updates,
      { new: true, runValidators: true }
    ).populate('classId', 'name description');

    res.status(200).json({
      message: "Subject updated successfully",
      subject: updatedSubject
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid subject ID format" 
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
      message: "Error updating subject",
      error: error.message
    });
  }
};

// Delete a subject (Teacher who created the class only)
exports.deleteSubject = async (req, res) => {
  try {
    const subjectId = req.params.id;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can delete subjects" 
      });
    }

    // Find the subject and verify ownership through class
    const subject = await Subject.findById(subjectId)
      .populate('classId', 'createdBy schoolId');

    if (!subject) {
      return res.status(404).json({ 
        message: "Subject not found" 
      });
    }

    // Verify the teacher owns the class
    if (subject.classId.createdBy.toString() !== teacherId || 
        subject.classId.schoolId.toString() !== schoolId) {
      return res.status(403).json({ 
        message: "Access denied" 
      });
    }

    // Remove the subject from the class's subjects array
    await Class.findByIdAndUpdate(
      subject.classId._id,
      { $pull: { subjects: subjectId } }
    );

    // Delete the subject
    await Subject.findByIdAndDelete(subjectId);

    res.status(200).json({
      message: "Subject deleted successfully"
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid subject ID format" 
      });
    }
    res.status(500).json({
      message: "Error deleting subject",
      error: error.message
    });
  }
};
