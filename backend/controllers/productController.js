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

export const resetDailyStats = asyncHandler(async (req, res) => {
  await Product.updateMany(
    { category: "cold_drink" },
    { $set: { dailyCount: 0, dailyRevenue: 0 } }
  );
  res.json({ success: true, message: "Today's cold drink counters reset" });
});

// @desc  List recent cold drink sales — used to undo a mis-tap or a
//        customer exchange (e.g. they take a 1.5L, come back, want a
//        2.25L instead). Shows each sale with the product name so the
//        owner can find and reverse the right one.
// @route GET /api/products/sales/recent?limit=15
export const getRecentSales = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit) || 15;
  const sales = await Transaction.find({ type: "cold_drink_sale" })
    .sort({ transactionDate: -1 })
    .limit(limit)
    .populate("product", "name variant imageUrl")
    .lean();
  res.json({ success: true, data: sales });
});

// @desc  Undo a single cold drink sale — reverses it out of the product's
//        running dailyCount/dailyRevenue AND deletes the transaction
//        record. This is a full undo (not a new "return" entry), since a
//        mis-tap or exchanged bottle should disappear entirely rather than
//        show up as a separate negative line.
// @route DELETE /api/products/sales/:id
export const undoSale = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const sale = await Transaction.findOne({
        _id: req.params.id,
        type: "cold_drink_sale",
      }).session(session);
      if (!sale) {
        res.status(404);
        throw new Error("Sale not found");
      }

      await Product.findByIdAndUpdate(
        sale.product,
        { $inc: { dailyCount: -sale.quantity, dailyRevenue: -sale.amount } },
        { session }
      );

      await sale.deleteOne({ session });
    });
    res.json({ success: true, message: "Sale undone" });
  } finally {
    session.endSession();
  }
});