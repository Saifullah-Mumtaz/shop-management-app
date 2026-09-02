import mongoose from "mongoose";

/**
 * A Customer is any account the shop tracks money against — either a loan
 * (shop gave the customer credit) or an advance/ADD (customer prepaid the
 * shop). `balance` is a running total kept in sync by the Transaction
 * controller so the dashboard/list views never need to re-aggregate.
 */
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    accountType: {
      type: String,
      enum: ["loan", "advance"], // loan = they owe the shop, advance = shop owes them / prepaid credit
      required: true,
      index: true,
    },
    // Positive = customer owes the shop (loan). For 'advance' accounts this
    // represents remaining prepaid credit.
    balance: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Fast lookups for "list all loan accounts" / "list all advance accounts"
customerSchema.index({ accountType: 1, isActive: 1 });

export default mongoose.model("Customer", customerSchema);
