const Class = require("../models/Class");
const Subject = require("../models/Subject");
const User = require("../models/User");
const Invitation = require("../models/Invitation");

// Create a new class (Teacher only)
exports.createClass = async (req, res) => {
  try {
    const { name, description, fileUrl } = req.body;
    const teacherId = req.user.id; // From auth middleware
    const schoolId = req.user.schoolId; // From auth middleware

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can create classes" 
      });
    }

    const newClass = new Class({
      name,
      description,
      createdBy: teacherId,
      schoolId
    });

    await newClass.save();

    // Populate the createdBy field for response
    await newClass.populate('createdBy', 'name email');

    res.status(201).json({
      message: "Class created successfully",
      class: newClass
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating class",
      error: error.message
    });
  }
};

// Get all classes for a teacher's school
exports.getClasses = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const userRole = req.user.role;

    let query = { schoolId };

    // If user is a teacher, only show their own classes
    if (userRole === "teacher") {
      query.createdBy = req.user.id;
    }
    // If user is admin or super_admin, show all classes in the school
    // If user is student, show all classes in the school (they can view but not edit)

    const classes = await Class.find(query)
      .populate('createdBy', 'name email')
      .populate('subjects', 'title content')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Classes fetched successfully",
      classes
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching classes",
      error: error.message
    });
  }
};

// Get a single class by ID
exports.getClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user.schoolId;
    const userRole = req.user.role;

    let query = { _id: classId, schoolId };

    // If user is a teacher, only allow access to their own classes
    if (userRole === "teacher") {
      query.createdBy = req.user.id;
    }

    const classData = await Class.findOne(query)
      .populate('createdBy', 'name email')
      .populate({
        path: 'subjects',
        populate: {
          path: 'classId',
          select: 'name'
        }
      });

    if (!classData) {
      return res.status(404).json({ 
        message: "Class not found or access denied" 
      });
    }

    res.status(200).json({
      message: "Class fetched successfully",
      class: classData
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid class ID format" 
      });
    }
    res.status(500).json({
      message: "Error fetching class",
      error: error.message
    });
  }
};

// Update a class (Teacher who created it only)
exports.updateClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const updates = req.body;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can update classes" 
      });
    }

    // Find the class and verify ownership
    const existingClass = await Class.findOne({
      _id: classId,
      createdBy: teacherId,
      schoolId
    });

    if (!existingClass) {
      return res.status(404).json({ 
        message: "Class not found or access denied" 
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.createdBy;
    delete updates.schoolId;
    delete updates.subjects;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.status(200).json({
      message: "Class updated successfully",
      class: updatedClass
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
      message: "Error updating class",
      error: error.message
    });
  }
};

// Delete a class (Teacher who created it only)
exports.deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    // Verify the user is a teacher
    if (req.user.role !== "teacher") {
      return res.status(403).json({ 
        message: "Only teachers can delete classes" 
      });
    }

    // Find the class and verify ownership
    const existingClass = await Class.findOne({
      _id: classId,
      createdBy: teacherId,
      schoolId
    });

    if (!existingClass) {
      return res.status(404).json({ 
        message: "Class not found or access denied" 
      });
    }

    // Delete all subjects associated with this class
    await Subject.deleteMany({ classId });

    // Delete the class
    await Class.findByIdAndDelete(classId);

    res.status(200).json({
      message: "Class and associated subjects deleted successfully"
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid class ID format" 
      });
    }
    res.status(500).json({
      message: "Error deleting class",
      error: error.message
    });
  }
};

// Invite multiple students to a class (Teacher only) - now directly assigns
exports.inviteStudents = async (req, res) => {
  try {
    const classId = req.params.classId;
    const { studentIds } = req.body; // array of ObjectIds
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can invite students" });
    }

    const classData = await Class.findOne({ _id: classId, createdBy: teacherId, schoolId });
    if (!classData) {
      return res.status(404).json({ message: "Class not found or access denied" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "studentIds array is required" });
    }

    // Filter to students in the same school with role student
    const validStudents = await User.find({ 
      _id: { $in: studentIds }, 
      schoolId, 
      role: "student" 
    }).select("_id");

    const validStudentIds = validStudents.map(s => s._id.toString());

    const results = { added: [], alreadyInClass: [], invalid: [] };

    for (const sid of studentIds) {
      if (!validStudentIds.includes(String(sid))) {
        results.invalid.push(String(sid));
        continue;
      }

      // If already in class, skip
      if (classData.students?.some(s => String(s) === String(sid))) {
        results.alreadyInClass.push(String(sid));
        continue;
      }

      // Directly add to class memberships
      await Class.findByIdAndUpdate(classId, { $addToSet: { students: sid } });
      results.added.push(String(sid));
    }

    return res.status(200).json({ message: "Students assigned to class", results });
  } catch (error) {
    return res.status(500).json({ message: "Error inviting students", error: error.message });
  }
};

// Get class students (list members)
exports.getClassStudents = async (req, res) => {
  try {
    const classId = req.params.classId;
    const schoolId = req.user.schoolId;
    const role = req.user.role;

    const classQuery = { _id: classId, schoolId };
    if (role === "teacher") {
      classQuery.createdBy = req.user.id;
    }

    const classData = await Class.findOne(classQuery).populate({
      path: "students",
      select: "name email"
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found or access denied" });
    }

    return res.status(200).json({ message: "Class students fetched", students: classData.students });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching class students", error: error.message });
  }
};

// Get classes assigned to the current student
exports.getMyClasses = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can access their classes" });
    }

    const classes = await Class.find({
      schoolId: req.user.schoolId,
      students: req.user.id
    })
      .populate('createdBy', 'name email')
      .select('name description fileUrl createdBy schoolId')
      .sort({ createdAt: -1 });

    return res.status(200).json({ message: "Assigned classes fetched", classes });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching assigned classes", error: error.message });
  }
};

// Remove a student from a class (Teacher owner only)
exports.removeStudentFromClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const studentId = req.params.studentId;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can remove students" });
    }

    const classData = await Class.findOne({ _id: classId, createdBy: teacherId, schoolId });
    if (!classData) {
      return res.status(404).json({ message: "Class not found or access denied" });
    }

    await Class.findByIdAndUpdate(classId, { $pull: { students: studentId } });

    return res.status(200).json({ message: "Student removed from class" });
  } catch (error) {
    return res.status(500).json({ message: "Error removing student", error: error.message });
  }
};
