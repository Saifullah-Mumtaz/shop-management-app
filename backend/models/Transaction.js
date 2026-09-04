import mongoose from "mongoose";

/**
 * Every money movement in the shop is one Transaction: a loan given, a loan
 * repaid, an advance taken, an advance used, an installment item given, an
 * installment payment received, or a cold-drink sale. Loan and Installment
 * each get their OWN pair of type strings (never shared) so they can never
 * accidentally mix in a report or aggregation that filters by type.
 */
const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "loan_given",
        "loan_repaid",
        "advance_deposit",
        "advance_used",
        "installment_given",
        "installment_repaid",
        "cold_drink_sale",
      ],
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
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

transactionSchema.index({ type: 1, transactionDate: -1 });

export default mongoose.model("Transaction", transactionSchema);