import express from "express";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCustomerTransactions,
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.get("/customer/:customerId", getCustomerTransactions);

export default router;