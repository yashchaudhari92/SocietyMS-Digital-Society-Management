const express = require("express");
const router = express.Router();

const {
  createMonthlyPayments,
  uploadPayment,
  getAllPayments,
  updateStatus,
  addCashPayment,
} = require("../controllers/paymentController");

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");
const isUser = require("../middleware/userMiddleware");
const { getUserPayments, getMonthlySummary, getPaymentHistory } = require("../controllers/paymentController");
const upload = require("../middleware/upload");


// Admin: create monthly data
router.post("/create", auth, isAdmin, createMonthlyPayments);

// User: upload payment
router.post("/upload", auth, isAdmin, upload.single("screenshot"), uploadPayment);

// New Cash payment Route
router.post("/cash", auth, isAdmin, addCashPayment);

// Admin: view all payments
router.get("/", auth, isAdmin, getAllPayments);

// User: View payment details
router.get("/my", auth, isUser, getUserPayments);

// Admin: approve/reject
router.put("/:id", auth, isAdmin, updateStatus);

// Admin can see prev months history
router.get("/history/:flatId", auth, isAdmin, getPaymentHistory);

// Admin: see monthly collection
router.get("/summary", auth, isAdmin, getMonthlySummary);

module.exports = router;