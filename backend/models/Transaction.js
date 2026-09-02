import mongoose from "mongoose";

/**
 * Every money movement in the shop is one Transaction: a loan given, a loan
 * repaid, an advance taken, an advance used, or a cold-drink sale. Keeping
 * one collection (instead of separate LoanEntry / SaleEntry collections)
 * means the nightly report and the customer history view are both a single
 * indexed query away.
 */
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "loan_given", // shop extends credit to customer (+balance)
        "loan_repaid", // customer pays back (-balance)
        "advance_deposit", // customer prepays shop (+balance on advance acct)
        "advance_used", // customer draws down prepaid credit (-balance)
        "cold_drink_sale", // POS sale, not tied to a customer account
      ],
      required: true,
      index: true,
    },
    // Present for loan_* / advance_* transactions, absent for anonymous
    // cold-drink sales rung up at the counter.
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    // Present for cold_drink_sale transactions.
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Denormalized so the daily report doesn't need a $lookup just to
    // group by calendar day in the shop's local timezone.
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// The dashboard/report queries are always "give me everything of type X
// within date range Y" — this compound index covers that access pattern.
transactionSchema.index({ type: 1, transactionDate: -1 });

export default mongoose.model("Transaction", transactionSchema);
