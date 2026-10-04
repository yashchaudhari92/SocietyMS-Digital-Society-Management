const Expense = require("../models/Expense");

// ➕ Add Expense
exports.addExpense = async (req, res) => {
  try {
    const { date, taskName, amount, paidTo, paymentMode, givenBy } = req.body;

    const expense = await Expense.create({
      adminId: req.user.id,
      date,
      taskName,
      amount,
      paidTo,
      paymentMode,
      givenBy,
    });

    res.status(201).json(expense);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📄 Get All Expenses
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      adminId: req.user.id,
    }).sort({ date: -1 });

    res.json(expenses);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📊 Expense Summary (weekly / monthly / yearly)
exports.getExpenseSummary = async (req, res) => {
  try {
    const now = new Date();

    // WEEK START (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);

    // MONTH START
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // YEAR START
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const expenses = await Expense.find({
      adminId: req.user.id,
    });

    let weekly = 0;
    let monthly = 0;
    let yearly = 0;

    expenses.forEach((e) => {
      const d = new Date(e.date);

      if (d >= weekStart) weekly += e.amount;
      if (d >= monthStart) monthly += e.amount;
      if (d >= yearStart) yearly += e.amount;
    });

    res.json({ weekly, monthly, yearly });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};