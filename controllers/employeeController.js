const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendMail = require('../utils/sendMail');

const asyncHandler = require('express-async-handler');

// OTP store (in-memory, for production use Redis or DB)
let otpStore = {};

const isValidEmailDomain = (email) => {
  return email.endsWith('@signavoxtechnologies.com');
};

// const getProfile = asyncHandler(async (req, res) => {
//   const employee = req.employee;
//   res.status(200).json(employee);
// });


const getProfile = asyncHandler(async (req, res) => {
  const employee = req.employee;

  res.status(200).json({
    _id: employee._id,
    name: employee.name,
    email: employee.email,
    employeeId: employee.employeeId,
    role: employee.role,
    team: employee.team,
    bloodGroup: employee.bloodGroup,
    profileImage: employee.profileImage,
    status: employee.status,
    isAvailable: employee.isAvailable,
  });
});




// @desc    Update logged-in employee profile
// @route   PUT /api/employees/profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    // console.log(req.body)
    const updated = await Employee.findByIdAndUpdate(req.body._id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all employees (admin only)
// @route   GET /api/employees/
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete employee (admin only)
// @route   DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get total and role-wise employee count
// @route   GET /api/employees/count
const getEmployeeCounts = async (req, res) => {
  try {
    const total = await Employee.countDocuments();

    const roleCounts = await Employee.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleCountMap = {};
    roleCounts.forEach((rc) => {
      roleCountMap[rc._id] = rc.count;
    });

    res.json({
      total,
      roleWise: roleCountMap,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update employee profile image (with Multer + Cloudinary)
// @route   PUT /api/employees/profile-image
const updateProfileImage = asyncHandler(async (req, res) => {
  const { _id } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No image file uploaded' });
  }

  const employee = await Employee.findById(_id);
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Upload to Cloudinary
  const cloudinary = require('../utils/cloudinary'); // adjust if your path is different
  const result = await cloudinary.uploader.upload(file.path, {
    folder: 'signavox/employees', // optional folder in Cloudinary
    resource_type: 'image',
  });

  // Update profileImage field
  employee.profileImage = result.secure_url;
  await employee.save();

  res.status(200).json({ message: 'Profile image updated successfully', profileImage: result.secure_url });
});

// @desc    Get all employees with 'Support' role
// @route   GET /api/employees/support
const getSupportEmployees = asyncHandler(async (req, res) => {
  try {
    const supportEmployees = await Employee.find({ role: 'Support' });
    res.status(200).json(supportEmployees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = {
  updateProfile,
  getProfile,
  getAllEmployees,
  getEmployeeById,
  deleteEmployee,
  getEmployeeCounts,
  updateProfileImage,
  getSupportEmployees
};