const mongoose = require('mongoose');

const FlatSchema = new mongoose.Schema({
    societyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Society",
        required: true,
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: null,
    },
    wing: {
        type: String,
        required: true,
    },
    flatNo: {
        type: String,
        required: true,
    },
    ownerName: {
        type: String,
        required: true,
    },
    flatType: {
        type: String,
        required: true,
    },
    occupantType: {
        type: String,
        enum: ["owner", "tenant"],
        required: true,
    },
    maintenanceAmount: {
        type: Number,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    pendingAmount: {
        type: Number,
        default: 0,
    },
    
},
    { timestamps: true }
);

module.exports = mongoose.model("Flat", FlatSchema);