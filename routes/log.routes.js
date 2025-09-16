import express from "express";
import protect from "../middleware/auth.middleware.js";
import { searchLogs } from "../controllers/log.controller.js";

const router = express.Router();

// Route for searching and filtering logs
// This route is protected, requiring authentication
router.get("/search", protect, searchLogs);

export default router;
