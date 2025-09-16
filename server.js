import express from "express";
import dotenv from "dotenv";
import { sequelize } from "./models/index.js";
import userRoutes from "./routes/user.routes.js";
import accountRoutes from "./routes/account.routes.js";
import destinationRoutes from "./routes/destination.routes.js"; // Import destination routes
import logRoutes from "./routes/log.routes.js"; // Import log routes
import dispatchEvent from "./services/eventDispatcher.js"; // Import the event dispatcher
import { body, validationResult } from "express-validator"; // Import validation functions

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api-user", userRoutes);
app.use("/api-account", accountRoutes);
app.use("/api-destination", destinationRoutes); // Use destination routes
app.use("/api-log", logRoutes); // Use log routes

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

// Middleware to handle validation errors (re-using from user routes for consistency)
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

// Example route to dispatch an event to a worker thread
app.post(
  "/dispatch-example",
  dispatchEventValidationRules,
  validate,
  async (req, res) => {
    const eventData = {
      id: Date.now(), // Simple unique ID for the event
      type: req.body.type, // Use validated type
      payload: req.body.payload || { message: "Hello from main thread!" }, // Use validated payload
    };

    console.log(
      `Received request to dispatch event: ${JSON.stringify(eventData)}`
    );

    try {
      // Log the dispatch action
      console.log(`Dispatching event ${eventData.id} to background worker...`);
      const result = await dispatchEvent(eventData);
      // Log the result from the worker
      console.log(
        `Event ${eventData.id} processed successfully by worker: ${result}`
      );
      res.status(200).json({
        message: "Event dispatched for background processing.",
        eventId: eventData.id,
        workerResult: result,
      });
    } catch (error) {
      console.error(
        `Failed to dispatch or process event ${eventData.id}:`,
        error
      );
      res.status(500).json({
        message: "Failed to dispatch event for background processing.",
        eventId: eventData.id,
        error: error.message,
      });
    }
  }
);

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
