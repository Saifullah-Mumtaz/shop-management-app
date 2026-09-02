import express from "express";
import {
  getFundAccounts,
  createFundAccount,
  updateFundAccount,
  deleteFundAccount,
} from "../controllers/fundAccountController.js";

const router = express.Router();

router.route("/").get(getFundAccounts).post(createFundAccount);
router.route("/:id").put(updateFundAccount).delete(deleteFundAccount);

export default router;