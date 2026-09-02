import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";

dotenv.config();

// NOTE: imageUrl paths below assume you'll drop matching image files into
// client/public/bottles/ yourself and can rename these paths to match
// whatever filenames you end up using.
const sampleProducts = [
  // Shared bottle icon per SIZE (not per brand) — same icon, same price bracket
  { name: "Cold Drink", variant: "2.25L", price: 280, profit: 41, category: "cold_drink", imageUrl: '/bottles/jumbo.png' },
  { name: "Cold Drink", variant: "1.5L", price: 230, profit: 37, category: "cold_drink", imageUrl: "/bottles/1.5l.jpeg" },
  { name: "Cold Drink", variant: "1L", price: 180, profit: 24, category: "cold_drink", imageUrl: "/bottles/1liter.jpeg" },

  // Named/specific items with their own icon
  { name: "Water", variant: "1L", price: 100, profit: 26, category: "cold_drink", imageUrl: "/bottles/aquafina-1liter.jpeg" },
  { name: "Branded Water", variant: "0.5L", price: 50, profit: 10, category: "cold_drink", imageUrl: "/bottles/aquafina-500ml.jpeg" },
  { name: "Slice", variant: "Juice", price: 60, profit: 16, category: "cold_drink", imageUrl: "/bottles/slice.jpeg" },
   { name: "Slice", variant: "1L", price: 200, profit: 45, category: "cold_drink", imageUrl: "/bottles/slice-1l.jpg" },
  { name: "Local Water", variant: "1L", price: 70, profit: 20, category: "cold_drink", imageUrl: "/bottles/1.5-ltr-water.webp" },
  { name: "Local Water", variant: "0.5L", price: 30, profit: 10, category: "cold_drink", imageUrl: "/bottles/local-500ml.jpeg" },
  { name: "Sting", variant: "300ml", price: 100, profit: 27, category: "cold_drink", imageUrl: "/bottles/sting-300ml.jpg" },
{ name: "Sting", variant: "0.5l", price: 140, profit: 23, category: "cold_drink", imageUrl: "/bottles/sting-300ml.jpg" },
  // Disposable glass — sold as its own tappable tile, ₹5 each, added straight
  // into the same cold-drink sales total.
  { name: "Disposable Glass", variant: "", price: 5, profit: 2, category: "cold_drink", imageUrl: "/bottles/disposible.webp" },
];

const run = async () => {
  await connectDB();
  await Product.deleteMany({ category: "cold_drink" });
  await Product.insertMany(sampleProducts);
  console.log(`Seeded ${sampleProducts.length} products.`);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});