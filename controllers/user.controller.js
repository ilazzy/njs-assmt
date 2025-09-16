import models from "../models/index.js";

// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await models.User.findAll();
    res.json(users); // Or use res.render() if using views
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// POST create user
export const createUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await models.User.create({ email, password });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
