import mongoose from "mongoose";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getProducts = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  const products = await Product.find(filter).sort({ name: 1 }).lean();
  res.json({ success: true, count: products.length, data: products });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, variant, price, profit, imageUrl, category } = req.body;
  const product = await Product.create({ name, variant, price, profit, imageUrl, category });
  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ success: true, data: product });
});

export const sellProduct = asyncHandler(async (req, res) => {
  const quantity = Number(req.body.quantity) || 1;
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const product = await Product.findById(req.params.id).session(session);
      if (!product) {
        res.status(404);
        throw new Error("Product not found");
      }
      const amount = product.price * quantity;
      product.dailyCount += quantity;
      product.dailyRevenue += amount;
      await product.save({ session });

      await Transaction.create(
        [{ type: "cold_drink_sale", product: product._id, quantity, amount }],
        { session }
      );
      result = product;
    });
    res.json({
      success: true,
      data: { id: result._id, dailyCount: result.dailyCount, dailyRevenue: result.dailyRevenue },
    });
  } finally {
    session.endSession();
  }
});

// @desc  Wipe today's cold-drink counters back to zero — used when the
//        owner wants a clean slate (e.g. after closing the register, or to
//        correct a mistaken run of test taps). Does NOT touch the historical
//        Transaction records, only the fast on-screen counters.
// @route POST /api/products/reset-daily
export const resetDailyStats = asyncHandler(async (req, res) => {
  await Product.updateMany(
    { category: "cold_drink" },
    { $set: { dailyCount: 0, dailyRevenue: 0 } }
  );
  res.json({ success: true, message: "Today's cold drink counters reset" });
});