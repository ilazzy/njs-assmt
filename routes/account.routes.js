import express from "express";
import fetch from "node-fetch";
import models from "../models/index.js";

const router = express.Router();

router.post("/accounts", async (req, res) => {
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

export default router;
