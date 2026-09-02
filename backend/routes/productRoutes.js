import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  sellProduct,
  resetDailyStats,
} from "../controllers/productController.js";

const router = express.Router();

router.route("/").get(getProducts).post(createProduct);
router.put("/:id", updateProduct);
router.post("/:id/sell", sellProduct);
router.post("/reset-daily", resetDailyStats);

export default router;