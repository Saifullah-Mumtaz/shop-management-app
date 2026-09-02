import FundAccount from "../models/FundAccount.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getFundAccounts = asyncHandler(async (req, res) => {
  const accounts = await FundAccount.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ success: true, data: accounts });
});

export const createFundAccount = asyncHandler(async (req, res) => {
  const { name, balance, notes } = req.body;
  const account = await FundAccount.create({ name, balance: balance || 0, notes });
  res.status(201).json({ success: true, data: account });
});

// @desc  Directly overwrite an account's balance (or name/notes) — this is
//        a plain edit, not an increment. Matches how the shop actually
//        works: tap the account, type the current real balance, save.
// @route PUT /api/fund-accounts/:id
export const updateFundAccount = asyncHandler(async (req, res) => {
  const { name, balance, notes } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (notes !== undefined) update.notes = notes;
  if (balance !== undefined) {
    if (isNaN(Number(balance))) {
      res.status(400);
      throw new Error("balance must be a number");
    }
    update.balance = Number(balance);
  }

  const account = await FundAccount.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }
  res.json({ success: true, data: account });
});

export const deleteFundAccount = asyncHandler(async (req, res) => {
  const account = await FundAccount.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!account) {
    res.status(404);
    throw new Error("Account not found");
  }
  res.json({ success: true, message: "Account removed" });
});