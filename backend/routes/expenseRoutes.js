const express = require("express");
const router = express.Router();

const {
  addExpense,
  getExpenses,
} = require("../controllers/expenseController");

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");
const { getExpenseSummary } = require("../controllers/expenseController");

// ➕ Add expense
router.post("/add", auth, isAdmin, addExpense);

// 📄 Get expenses
router.get("/", auth, isAdmin, getExpenses);

router.get("/summary", auth, isAdmin, getExpenseSummary);

module.exports = router;