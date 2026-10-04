const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    taskName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paidTo: {
      type: String,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank"],
      required: true,
    },

    givenBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);