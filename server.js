import destinationRoutes from "./routes/destination.routes.js";
import { body, validationResult } from "express-validator"; 
import accountRoutes from "./routes/account.routes.js";
import userRoutes from "./routes/user.routes.js";
import logRoutes from "./routes/log.routes.js";
import { sequelize } from "./models/index.js";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api-user", userRoutes);
app.use("/api-account", accountRoutes);
app.use("/api-destination", destinationRoutes);
app.use("/api-log", logRoutes);

app.get("/", (req, res) => {
  res.json({ title: "User Management App" });
});

// Validation rules for event dispatching
const dispatchEventValidationRules = [
  body("type").notEmpty().withMessage("Event type is required"),
  body("payload")
    .optional()
    .isObject()
    .withMessage("Payload must be an object"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    success: false,
    message: "Invalid Data",
    errors: extractedErrors,
  });
};

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");
    try {
      app.listen(PORT, () =>
        console.log(`Server running on http://localhost:${PORT}`)
      );
    } catch (err) {
      console.error("❌ Failed to start server:", err.message);
    }
  } catch (err) {
    console.error("❌ Failed to connect to DB:", err.message);
  }
};

start();

export default app;
