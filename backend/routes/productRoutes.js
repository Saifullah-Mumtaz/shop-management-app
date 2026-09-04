import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  sellProduct,
  subtractProduct,
  resetDailyStats,
} from "../controllers/productController.js";

const router = express.Router();

router.route("/").get(getProducts).post(createProduct);
router.put("/:id", updateProduct);
router.post("/:id/sell", sellProduct);
router.post("/:id/subtract", subtractProduct);
router.post("/reset-daily", resetDailyStats);

export default router;