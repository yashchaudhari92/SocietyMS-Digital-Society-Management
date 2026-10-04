const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    flatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Flat",
    },

    month: {
        type: String, // "2026-03"
    },

    amount: Number,

    paidAmount: {
        type: Number,
        default: 0,
    },

    remainingAmount: {
        type: Number,
    },

    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },

    paymentMethod: {
        type: String,
        enum: ["online", "cash"],
        default: "online",
    },

    screenshot: String,

    paymentDate: Date,

    uploadedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Payment", paymentSchema);