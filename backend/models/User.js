const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },

    email: {
        type: String,
        unique: true
    },

    password: {
        type: String
    },

    contactNumber: {
        type: String,
        required: true,
    },

    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);