import express from "express";
import { body, validationResult } from "express-validator"; // Import body validator and validationResult
import {
  getAllUsers,
  registerUser,
  loginUser,
} from "../controllers/user.controller.js";
import protect from "../middleware/auth.middleware.js";
import {
  authorize,
  authorizeRoles,
} from "../middleware/authorize.middleware.js";

const router = express.Router();

// Validation rules for user registration
const registerValidationRules = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Validation rules for user login
const loginValidationRules = [
  body("email").isEmail().withMessage("Invalid email format"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  // Respond with the specified format for invalid inputs
  return res.status(422).json({
    success: false,
    message: "Invalid Data",
    errors: extractedErrors,
  });
};

// Public routes
router.post("/register", registerValidationRules, validate, registerUser);
router.post("/login", loginValidationRules, validate, loginUser);
router.get("/get-all", protect, authorize("ADMIN"), getAllUsers);

export default router;
