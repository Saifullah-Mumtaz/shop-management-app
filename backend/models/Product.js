import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Product name is required"], trim: true },
    variant: { type: String, trim: true, default: "" },
    price: { type: Number, required: [true, "Price is required"], min: 0 },
    // Rough profit-per-unit for now — owner will confirm exact figures with
    // his brother later and these can be edited per product at that point.
    profit: { type: Number, default: 20, min: 0 },
    imageUrl: { type: String, default: "/placeholders/drink.svg" },
    category: { type: String, default: "cold_drink", index: true },
    dailyCount: { type: Number, default: 0 },
    dailyRevenue: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);