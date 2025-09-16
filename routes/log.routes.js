import express from "express";
import protect from "../middleware/auth.middleware.js";
import { searchLogs } from "../controllers/log.controller.js";

const router = express.Router();

router.get("/search", protect, searchLogs);

export default router;
