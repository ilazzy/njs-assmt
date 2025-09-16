import express from "express";
import protect from "../middleware/auth.middleware.js";
import { searchDestinations } from "../controllers/destination.controller.js";

const router = express.Router();

router.get("/search", protect, searchDestinations);

export default router;
