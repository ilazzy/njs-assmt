import express from "express";
import { getAllUsers, createUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/get-all", getAllUsers);
router.post("/create", createUser);

export default router;
