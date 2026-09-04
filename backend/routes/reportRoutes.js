import express from "express";
import {
  getDashboardSummary,
  getDailyReport,
  getTransactionsByDate,
} from "../controllers/reportController.js";

const router = express.Router();

router.get("/dashboard", getDashboardSummary);
router.get("/daily", getDailyReport);
router.get("/transactions", getTransactionsByDate);

export default router;