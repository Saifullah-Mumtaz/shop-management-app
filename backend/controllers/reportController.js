import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getDashboardSummary = asyncHandler(async (req, res) => {
  const [loanAgg, advanceAgg, coldDrinkProducts, totalAccounts] = await Promise.all([
    // Sum of outstanding balances across all loan accounts
    Customer.aggregate([
      { $match: { accountType: "loan", isActive: true } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),
    // Sum of outstanding balances across all advance accounts
    Customer.aggregate([
      { $match: { accountType: "advance", isActive: true } },
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),
    // Cold drink sales come from Product.dailyRevenue/dailyCount — the same
    // running counters the Cold Drinks page taps increment. This is the
    // ONLY source used for cold drink numbers anywhere in the app now, so
    // hitting "Reset day" on the Cold Drinks page zeroes it everywhere at
    // once (Home, Cold Drinks page, and the Overall Report below).
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
      coldDrinkSalesToday: {
        revenue: coldDrinkRevenue,
        units: coldDrinkUnits,
      },
      totalAccounts,
    },
  });
});

// @desc  Overall report: loan/advance movements are all-time totals from
//        the Transaction ledger. The cold_drink_sale row is pulled from
//        Product.dailyRevenue/dailyCount instead of the ledger, so it
//        stays perfectly in sync with the Cold Drinks page and Home card —
//        reset there, and this number drops to 0 here too.
// @route GET /api/reports/daily
export const getDailyReport = asyncHandler(async (req, res) => {
  const [breakdown, coldDrinkProducts] = await Promise.all([
    Transaction.aggregate([
      { $match: { type: { $ne: "cold_drink_sale" } } },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
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
    data: { summary, grandTotal, transactionCount },
  });
});