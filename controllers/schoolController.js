const School = require("../models/School");
const User = require("../models/User");
const Class = require("../models/Class");

// Create a new school
exports.createSchool = async (req, res) => {
  try {
    const { name, address, email } = req.body;

    const newSchool = new School({ name, address, email });
    await newSchool.save();

    res
      .status(201)
      .json({ message: "School created successfully", school: newSchool });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating school", error: error.message });
  }
};

// Get all schools
exports.getSchools = async (req, res) => {
  try {
    const schools = await School.find();
    res.status(200).json({ message: "Schools fetched successfully", schools });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching schools", error: error.message });
  }
};

// Get students in a school who are not yet in a given class (available to invite)
exports.getAvailableStudents = async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    const classId = req.query.classId; // optional filter by class

    // Only allow admins and teachers of the school
    if (!req.user || String(req.user.schoolId) !== String(schoolId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let excludedStudentIds = [];
    if (classId) {
      const classData = await Class.findOne({ _id: classId, schoolId }).select("students");
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      excludedStudentIds = classData.students || [];
    }

    const search = (req.query.search || "").trim();
    const searchFilter = search
      ? { $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ] }
      : {};

    const students = await User.find({
      schoolId,
      role: "student",
      _id: { $nin: excludedStudentIds }
    })
      .find(searchFilter)
      .select("name email");

    return res.status(200).json({ message: "Available students fetched", students });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching available students", error: error.message });
  }
};
