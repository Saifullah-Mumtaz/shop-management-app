import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [loanAgg, advanceAgg, coldDrinkProducts, totalAccounts] = await Promise.all([
    Customer.aggregate([
      { $match: { accountType: "loan", isActive: true } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),
    Customer.aggregate([
      { $match: { accountType: "advance", isActive: true } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),
    Product.find({ category: "cold_drink", isActive: true })
      .select("dailyCount dailyRevenue")
      .lean(),
    Customer.countDocuments({ isActive: true }),
  ]);

  const coldDrinkRevenue = coldDrinkProducts.reduce((sum, p) => sum + (p.dailyRevenue || 0), 0);
  const coldDrinkUnits = coldDrinkProducts.reduce((sum, p) => sum + (p.dailyCount || 0), 0);

  res.json({
    success: true,
    data: {
      totalLoans: loanAgg[0]?.total || 0,
      totalAdvance: advanceAgg[0]?.total || 0,
      coldDrinkSalesToday: { revenue: coldDrinkRevenue, units: coldDrinkUnits },
      totalAccounts,
    },
  });
});

export const getDailyReport = asyncHandler(async (req, res) => {
  const targetDate = req.query.date ? new Date(req.query.date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const [breakdown, coldDrinkProducts] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          type: { $ne: "cold_drink_sale" },
          transactionDate: { $gte: startOfDay, $lte: endOfDay },
        },
      },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    // Cold drinks still come from the live running counters (not tied to
    // calendar date) since that's what "Reset day" controls on the Cold
    // Drinks page — this keeps that number consistent everywhere it shows.
    Product.find({ category: "cold_drink", isActive: true })
      .select("dailyCount dailyRevenue")
      .lean(),
  ]);

  const summary = breakdown.reduce((acc, row) => {
    acc[row._id] = { totalAmount: row.totalAmount, count: row.count };
    return acc;
  }, {});

  const coldDrinkRevenue = coldDrinkProducts.reduce((sum, p) => sum + (p.dailyRevenue || 0), 0);
  const coldDrinkUnits = coldDrinkProducts.reduce((sum, p) => sum + (p.dailyCount || 0), 0);
  summary.cold_drink_sale = { totalAmount: coldDrinkRevenue, count: coldDrinkUnits };

  const grandTotal = breakdown.reduce((sum, row) => sum + row.totalAmount, 0) + coldDrinkRevenue;
  const transactionCount = breakdown.reduce((s, r) => s + r.count, 0) + coldDrinkUnits;

  res.json({
    success: true,
    date: startOfDay.toISOString().slice(0, 10),
    data: { summary, grandTotal, transactionCount },
  });
});

export const getTransactionsByDate = asyncHandler(async (req, res) => {
  const targetDate = req.query.date ? new Date(req.query.date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const transactions = await Transaction.find({
    type: { $in: ["loan_given", "loan_repaid", "advance_deposit"] },
    transactionDate: { $gte: startOfDay, $lte: endOfDay },
  })
    .sort({ transactionDate: -1 })
    .populate("customer", "name accountType")
    .lean();

  res.json({
    success: true,
    date: startOfDay.toISOString().slice(0, 10),
    count: transactions.length,
    data: transactions,
  });
});