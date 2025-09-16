import express from "express";
import protect from "../middleware/auth.middleware.js";
import { searchDestinations } from "../controllers/destination.controller.js";

const router = express.Router();

// Route for searching and filtering destinations
// This route is protected, requiring authentication
router.get("/search", protect, searchDestinations);

export default router;
