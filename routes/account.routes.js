import { searchAccounts } from "../controllers/account.controller.js";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import dispatchEvent from "../services/eventDispatcher.js";
import { validationResult, body } from "express-validator";
import protect from "../middleware/auth.middleware.js";
import models from "../models/index.js";
import fetch from "node-fetch";
import express from "express";

const router = express.Router();

// Rate limiter configuration for incoming data per account
const accountDataLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 5, // Limit each account to 5 requests per second
  keyGenerator: (req) => {
    const token = req.header("CL-X-TOKEN");
    if (token) {
      return token;
    }
    return ipKeyGenerator(req.ip);
  },
  message: "Too many requests from this account, please try again later.",
});

// Validation rules for incoming data
const validateIncomingData = () => {
  return [
    body("CL-X-TOKEN").exists().withMessage("CL-X-TOKEN header is missing"),
    body("CL-X-EVENT-ID")
      .exists()
      .withMessage("CL-X-EVENT-ID header is missing"),
    body().custom((value, { req }) => {
      if (Object.keys(value).length === 0) {
        throw new Error("Request body cannot be empty");
      }
      return true;
    }),
  ];
};

router.post(
  "/accounts",
  accountDataLimiter,
  validateIncomingData(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log validation errors
      await models.Log.create({
        level: "warn",
        message: "Incoming data validation failed",
        details: JSON.stringify(errors.array()),
        userId: req.user ? req.user.id : null, // User might not be authenticated here
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ errors: errors.array() });
    }

    console.log("Received account data:", req.body);

    const secretToken = req.header("CL-X-TOKEN");
    const eventId = req.header("CL-X-EVENT-ID");

    if (!secretToken || !eventId) {
      await models.Log.create({
        level: "warn",
        message: "Incoming data request missing required headers",
        details: JSON.stringify({ headers: req.headers }),
        userId: req.user ? req.user.id : null,
        timestamp: new Date().toISOString(),
      });
      return res.status(400).json({ message: "Missing required headers" });
    }

    try {
      const account = await models.Account.findOne({
        where: { secret_token: secretToken },
      });

      if (!account) {
        // Log invalid secret token
        await models.Log.create({
          level: "warn",
          message: "Incoming data request with invalid secret token",
          details: JSON.stringify({
            accountId: null,
            eventId: eventId,
            secretTokenProvided: secretToken,
          }),
          userId: req.user ? req.user.id : null,
          timestamp: new Date().toISOString(),
        });
        return res.status(401).json({ message: "Invalid secret token" });
      }

      // Log successful account lookup
      await models.Log.create({
        level: "info",
        message: "Account found for incoming data",
        details: JSON.stringify({ accountId: account.id, eventId: eventId }),
        userId: req.user ? req.user.id : null,
        timestamp: new Date().toISOString(),
      });

      const destinations = await models.Destination.findAll();

      for (const destination of destinations) {
        try {
          const response = await fetch(destination.URL, {
            method: destination.HTTP_method,
            headers: destination.headers
              ? JSON.parse(destination.headers)
              : { "Content-Type": "application/json" },
            body: JSON.stringify(req.body),
          });

          if (!response.ok) {
            console.error(
              `Webhook failed for ${destination.URL}: ${response.status} ${response.statusText}`
            );
            // Log webhook failure
            await models.Log.create({
              level: "error",
              message: "Webhook delivery failed",
              details: JSON.stringify({
                destinationId: destination.id,
                url: destination.URL,
                status: response.status,
                statusText: response.statusText,
                eventId: eventId,
                accountId: account.id,
              }),
              userId: req.user ? req.user.id : null,
              timestamp: new Date().toISOString(),
            });
          } else {
            console.log(`Webhook sent successfully to ${destination.URL}`);
            await models.Log.create({
              level: "info",
              message: "Webhook delivery successful",
              details: JSON.stringify({
                destinationId: destination.id,
                url: destination.URL,
                eventId: eventId,
                accountId: account.id,
              }),
              userId: req.user ? req.user.id : null,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(`Error sending webhook to ${destination.URL}:`, error);
          // Log error during webhook sending
          await models.Log.create({
            level: "error",
            message: "Error sending webhook",
            details: JSON.stringify({
              destinationId: destination.id,
              url: destination.URL,
              error: error.message,
              eventId: eventId,
              accountId: account.id,
            }),
            userId: req.user ? req.user.id : null,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Prepare event data for the worker
      const eventData = {
        type: "forward_data", // Type of event
        payload: req.body,
        accountId: account.id,
        eventId: eventId,
        userId: req.user ? req.user.id : null,
      };

      dispatchEvent(eventData)
        .then((result) => {
          console.log("Event dispatched successfully:", result);
        })
        .catch((error) => {
          console.error("Failed to dispatch event:", error);
          // Log failure to dispatch event
          models.Log.create({
            level: "error",
            message: "Failed to dispatch event to worker",
            details: JSON.stringify({
              eventData: eventData,
              error: error.message,
            }),
            userId: req.user ? req.user.id : null,
            timestamp: new Date().toISOString(),
          });
          // Respond with an error if dispatching failed
          res.status(500).json({
            message: "Failed to initiate data processing",
            error: error.message,
          });
        });

      res
        .status(202)
        .json({ message: "Account data received and processing initiated" });
    } catch (error) {
      console.error("Error processing incoming data:", error);
      // Log the general error during incoming data processing
      await models.Log.create({
        level: "error",
        message: "Error processing incoming data",
        details: JSON.stringify({ eventId: eventId, error: error.message }),
        userId: req.user ? req.user.id : null,
        timestamp: new Date().toISOString(),
      });
      res.status(500).json({
        message: "Internal server error processing incoming data",
        error: error.message,
      });
    }
  }
);

router.get("/search", protect, searchAccounts);

export default router;
