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

// @desc  The "minus" button — removes ONE unit from a product's running
//        count/revenue. It reverses the most recent still-existing sale
//        for that product (so the exchanged-bottle scenario, or a mis-tap,
//        is corrected by removing the last thing that happened, not an
//        arbitrary one). If there's no sale left to reverse, it does
//        nothing (can't go below zero).
// @route POST /api/products/:id/subtract
export const subtractProduct = asyncHandler(async (req, res) => {
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

      // Find the most recent sale of this exact product to reverse.
      const lastSale = await Transaction.findOne({
        type: "cold_drink_sale",
        product: product._id,
      })
        .sort({ transactionDate: -1 })
        .session(session);

      if (lastSale && product.dailyCount > 0) {
        const revertQty = Math.min(quantity, lastSale.quantity);
        const revertAmount = product.price * revertQty;

        product.dailyCount = Math.max(0, product.dailyCount - revertQty);
        product.dailyRevenue = Math.max(0, product.dailyRevenue - revertAmount);
        await product.save({ session });

        if (lastSale.quantity <= revertQty) {
          await lastSale.deleteOne({ session });
        } else {
          lastSale.quantity -= revertQty;
          lastSale.amount -= revertAmount;
          await lastSale.save({ session });
        }
      }

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

export const resetDailyStats = asyncHandler(async (req, res) => {
  await Promise.all([
    Product.updateMany(
      { category: "cold_drink" },
      { $set: { dailyCount: 0, dailyRevenue: 0 } }
    ),
    Transaction.deleteMany({ type: "cold_drink_sale" }),
  ]);
  res.json({ success: true, message: "Today's cold drink counters reset" });
});