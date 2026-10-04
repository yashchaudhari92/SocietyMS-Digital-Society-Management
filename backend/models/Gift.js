const mongoose = require("mongoose");

const giftSchema = new mongoose.Schema({
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Society",
        required: true,
    },

    type: {
        type: String,
        enum: ["donation", "flatSell"],
        required: true,
    },

    amount: {
        type: Number,
        required: true,
    },

    // Donation
    donorName: String,

    // Flat Sell
    wing: String,
    flatNo: String,
    ownerName: String,

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true });

module.exports = mongoose.model("Gift", giftSchema);