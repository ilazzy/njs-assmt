import express from "express";
import fetch from "node-fetch";
import models from "../models/index.js";
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import protect from "../middleware/auth.middleware.js"; // Import the authentication middleware
import { searchAccounts } from "../controllers/account.controller.js"; // Import the new controller function

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
    // Fallback to IP for unauthenticated users, wrapped with ipKeyGenerator
    return ipKeyGenerator(req.ip);
  },
  message: "Too many requests from this account, please try again later.",
});

// Existing route for receiving account data
router.post("/accounts", accountDataLimiter, async (req, res) => {
  console.log("Received account data:", req.body);

  const secretToken = req.header("CL-X-TOKEN");
  const eventId = req.header("CL-X-EVENT-ID");

  if (!secretToken || !eventId) {
    return res.status(400).json({ message: "Missing required headers" });
  }

  try {
    const account = await models.Account.findOne({ where: { secret_token: secretToken } });

    if (!account) {
      return res.status(401).json({ message: "Invalid secret token" });
    }

    const destinations = await models.Destination.findAll();

    for (const destination of destinations) {
      try {
        const response = await fetch(destination.URL, {
          method: destination.HTTP_method,
          headers: destination.headers ? JSON.parse(destination.headers) : { "Content-Type": "application/json" },
          body: JSON.stringify(req.body),
        });

        if (!response.ok) {
          console.error(`Webhook failed for ${destination.URL}: ${response.status} ${response.statusText}`);
        } else {
          console.log(`Webhook sent successfully to ${destination.URL}`);
        }
      } catch (error) {
        console.error(`Error sending webhook to ${destination.URL}:`, error);
      }
    }

    res.status(200).json({ message: "Account data received and forwarded" });
  } catch (error) {
    console.error("Error fetching destinations:", error);
    res.status(500).json({ message: "Failed to fetch destinations" });
  }
});

// New route for searching and filtering accounts
// This route is protected, requiring authentication
router.get("/search", protect, searchAccounts);

export default router;
