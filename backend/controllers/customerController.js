import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const getCustomers = asyncHandler(async (req, res) => {
  const { type, search } = req.query;
  const filter = { isActive: true };
  if (type) filter.accountType = type;
  if (search) filter.name = { $regex: search, $options: "i" };
  const customers = await Customer.find(filter).sort({ name: 1 }).lean();
  res.json({ success: true, count: customers.length, data: customers });
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  const history = await Transaction.find({ customer: customer._id })
    .sort({ transactionDate: -1 })
    .lean();
  res.json({ success: true, data: { ...customer, history } });
});

// @desc  Create a customer. If `amount` is given, it becomes the first
//        history entry (loan_given for loan accounts, advance_deposit for
//        advance accounts) and the starting balance — so a new loan
//        customer created with Name + Amount + Note already shows that
//        entry in their history, not just a raw balance number.
// @route POST /api/customers
export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, accountType, notes, amount, note } = req.body;
  const customer = await Customer.create({ name, phone, accountType, notes });

  const startAmount = Number(amount);
  if (startAmount > 0) {
    const type = accountType === "loan" ? "loan_given" : "advance_deposit";
    await Transaction.create({ customer: customer._id, type, amount: startAmount, note: note || "" });
    customer.balance = startAmount;
    await customer.save();
  }

  res.status(201).json({ success: true, data: customer });
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { name, phone, notes } = req.body;
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { name, phone, notes },
    { new: true, runValidators: true }
  );
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json({ success: true, data: customer });
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const existing = await Customer.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error("Customer not found");
  }
  if (existing.balance !== 0) {
    res.status(400);
    throw new Error("Cannot close an account with a non-zero balance. Settle it to 0 first.");
  }
  await Customer.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: "Account closed" });
});