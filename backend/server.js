import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import customerRoutes from "./routes/customerRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import fundAccountRoutes from "./routes/fundAccountRoutes.js";

dotenv.config();
await connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN||"*"}));
app.use(express.json());

app.get("/api/health",(req,res)=>res.json({success:true,status:"ok"}));

app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/fund-accounts", fundAccountRoutes);



app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));