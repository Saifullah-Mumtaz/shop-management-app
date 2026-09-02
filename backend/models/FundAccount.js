import mongoose from "mongoose";

/**
 * A FundAccount is one of the shop's own money pools — a mobile wallet, a
 * bank account, an "Easy Load" balance, etc. — completely separate from
 * customer Loan/Advance accounts. The owner creates as many as needed and
 * this just tracks a running balance per account.
 */
const fundAccountSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Account name is required"],
      trim: true,
    },
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

export default mongoose.model("FundAccount", fundAccountSchema);