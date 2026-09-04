import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import asyncHandler from "../middleware/asyncHandler.js";

const BALANCE_DELTA = {
  loan_given: (amount) => amount,
  loan_repaid: (amount) => -amount,
  advance_deposit: (amount) => amount,
  advance_used: (amount) => -amount,
  installment_given: (amount) => amount,
  installment_repaid: (amount) => -amount,
};

export const createTransaction = asyncHandler(async (req, res) => {
  const { customer, type, amount, note } = req.body;

  if (!BALANCE_DELTA[type]) {
    res.status(400);
    throw new Error(
      "type must be one of loan_given, loan_repaid, advance_deposit, advance_used, installment_given, installment_repaid"
    );
  }
  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error("amount must be a positive number");
  }

  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      const [txn] = await Transaction.create([{ customer, type, amount, note }], { session });
      const delta = BALANCE_DELTA[type](amount);
      const updated = await Customer.findByIdAndUpdate(
        customer,
        { $inc: { balance: delta } },
        { new: true, session }
      );
      if (!updated) throw new Error("Customer not found");
      created = txn;
    });
    res.status(201).json({ success: true, data: created });
  } finally {
    session.endSession();
  }
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const { amount, note } = req.body;
  if (amount === undefined || amount <= 0) {
    res.status(400);
    throw new Error("amount must be a positive number");
  }

  const session = await mongoose.startSession();
  try {
    let updated;
    await session.withTransaction(async () => {
      const txn = await Transaction.findById(req.params.id).session(session);
      if (!txn) {
        res.status(404);
        throw new Error("Transaction not found");
      }

      if (BALANCE_DELTA[txn.type]) {
        const oldDelta = BALANCE_DELTA[txn.type](txn.amount);
        const newDelta = BALANCE_DELTA[txn.type](amount);
        const diff = newDelta - oldDelta;
        await Customer.findByIdAndUpdate(txn.customer, { $inc: { balance: diff } }, { session });
      }

      txn.amount = amount;
      if (note !== undefined) txn.note = note;
      await txn.save({ session });
      updated = txn;
    });
    res.json({ success: true, data: updated });
  } finally {
    session.endSession();
  }
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const txn = await Transaction.findById(req.params.id).session(session);
      if (!txn) {
        res.status(404);
        throw new Error("Transaction not found");
      }
      if (BALANCE_DELTA[txn.type]) {
        const reversal = -BALANCE_DELTA[txn.type](txn.amount);
        await Customer.findByIdAndUpdate(
          txn.customer,
          { $inc: { balance: reversal } },
          { session }
        );
      }
      await txn.deleteOne({ session });
    });
    res.json({ success: true, message: "Transaction deleted and balance reversed" });
  } finally {
    session.endSession();
  }
});

export const getCustomerTransactions = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const transactions = await Transaction.find({ customer: req.params.customerId })
    .sort({ transactionDate: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  res.json({ success: true, page, count: transactions.length, data: transactions });
});