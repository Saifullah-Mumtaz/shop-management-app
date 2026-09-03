import express from "express";
import {
  getProducts,
  createProduct,
  updateProduct,
  sellProduct,
  resetDailyStats,
  getRecentSales,
  undoSale,
} from "../controllers/productController.js";

const router = express.Router();

router.route("/").get(getProducts).post(createProduct);
router.put("/:id", updateProduct);
router.post("/:id/sell", sellProduct);
router.post("/reset-daily", resetDailyStats);
router.get("/sales/recent", getRecentSales);
router.delete("/sales/:id", undoSale);

export default router;