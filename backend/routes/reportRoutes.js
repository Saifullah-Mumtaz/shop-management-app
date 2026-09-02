import express from "express";
import { getDashboardSummary, getDailyReport } from "../controllers/reportController.js";

const router = express.Router();

router.get("/dashboard", getDashboardSummary);
router.get("/daily", getDailyReport);

export default router;