import models from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import Log from '../models/log'; // Removed incorrect import

// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await models.User.findAll({
      include: [{ model: models.Role, as: "role" }], // Include role information
    });
    // Log successful retrieval of users
    await models.Log.create({
      level: 'info',
      message: 'Successfully retrieved all users',
      details: JSON.stringify({ count: users.length }),
      userId: req.user ? req.user.id : null, // Assuming user ID is available from auth middleware
      timestamp: new Date().toISOString(),
    });
    res.json(users); // Or use res.render() if using views
  } catch (err) {
    // Log the error during user retrieval
    await models.Log.create({
      level: 'error',
      message: 'Failed to fetch users',
      details: JSON.stringify({ error: err.message }),
      userId: req.user ? req.user.id : null,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// POST register user
export const registerUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the MEMBER role
    const memberRole = await models.Role.findOne({ where: { role_name: "MEMBER" } });
    if (!memberRole) {
      // Log the error if the default role is not found
      await models.Log.create({
        level: 'error',
        message: 'Default role not found during user registration',
        details: JSON.stringify({ email }),
        userId: null, // No user ID yet
        timestamp: new Date().toISOString(),
      });
      return res.status(500).json({ error: "Default role not found" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with the MEMBER role
    const user = await models.User.create({
      email,
      password: hashedPassword,
      roleId: memberRole.id, // Assign the roleId
    });

    // Log successful user registration
    await models.Log.create({
      level: 'info',
      message: 'User registered successfully',
      details: JSON.stringify({ userId: user.id, email: user.email }),
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    // Log the error during user registration
    await models.Log.create({
      level: 'error',
      message: 'Error during user registration',
      details: JSON.stringify({ email, error: err.message }),
      userId: null, // No user ID yet if registration failed
      timestamp: new Date().toISOString(),
    });
    res.status(400).json({ error: err.message });
  }
};

// POST login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find user by email and include their role
    const user = await models.User.findOne({
      where: { email },
      include: [{ model: models.Role, as: "role" }],
    });
    if (!user) {
      // Log failed login attempt
      await models.Log.create({
        level: 'warn',
        message: 'Login attempt failed: Invalid credentials',
        details: JSON.stringify({ email }),
        userId: null, // No user ID yet
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      await models.Log.create({
        level: 'warn',
        message: 'Login attempt failed: Invalid credentials',
        details: JSON.stringify({ email }),
        userId: user.id, // User found, but password incorrect
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT including user ID and role
    const token = jwt.sign(
      { id: user.id, role: user.role.role_name }, // Include role in payload
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Log successful login
    await models.Log.create({
      level: 'info',
      message: 'User logged in successfully',
      details: JSON.stringify({ userId: user.id, email: user.email }),
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    res.json({ token });
  } catch (err) {
    // Log the error during login
    await models.Log.create({
      level: 'error',
      message: 'Failed to login',
      details: JSON.stringify({ email, error: err.message }),
      userId: null,
      timestamp: new Date().toISOString(),
    });
    res.status(500).json({ error: "Failed to login" });
  }
};
