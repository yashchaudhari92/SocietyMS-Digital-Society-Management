const Society = require("../models/Society");
const Expense = require("../models/Expense");
const Gift = require("../models/Gift");
const Payment = require("../models/Payment");

exports.getBalance = async (req, res) => {
    try {
        const { societyId } = req.params;

        // 🔹 Get society
        const society = await Society.findById(societyId);

        if (!society) {
            return res.status(404).json({ message: "Society not found" });
        }

        // 🔹 Gifts
        const gifts = await Gift.find({ societyId });

        // 🔹 Expenses
        const expenses = await Expense.find({
            adminId: req.user.id
        });

        // 🔥 NEW: GET APPROVED PAYMENTS
        const payments = await Payment.find({
            adminId: req.user.id,
            status: "approved"
        }).populate("flatId");

        // 🔥 FILTER BY SOCIETY
        const filteredPayments = payments.filter(
            (p) =>
                p.flatId &&
                p.flatId.societyId &&
                p.flatId.societyId.toString() === societyId
        );

        // 🔥 GROUP BY MONTH (EXISTING - UNCHANGED)
        const maintenanceMap = {};

        filteredPayments.forEach((p) => {
            if (!p.month) return;

            if (!maintenanceMap[p.month]) {
                maintenanceMap[p.month] = 0;
            }

            maintenanceMap[p.month] += p.amount;
        });

        // 🔥 FINAL ARRAY (EXISTING - UNCHANGED)
        const maintenanceCollections = Object.keys(maintenanceMap).map(month => ({
            month,
            amount: maintenanceMap[month]
        }));

        // 🔥 ✅ NEW: DETAILED MAINTENANCE (ADDED ONLY)
        const maintenanceDetails = filteredPayments.map((p) => ({
            flatId: p.flatId?._id,
            wing: p.flatId?.wing,
            flatNo: p.flatId?.flatNo,
            ownerName: p.flatId?.ownerName,
            month: p.month,
            amount: p.amount,
            status: p.status
        }));

        // 🔹 CALCULATIONS (UNCHANGED)

        // ✅ Gifts Income
        const giftIncome = gifts.reduce(
            (sum, g) => sum + (g.amount || 0),
            0
        );

        // 🔥 Maintenance Income
        const maintenanceIncome = maintenanceCollections.reduce(
            (sum, m) => sum + m.amount,
            0
        );

        // ✅ Total Income (UNCHANGED LOGIC)
        const totalIncome = giftIncome + maintenanceIncome;

        // ✅ Total Expense
        const totalExpense = expenses.reduce(
            (sum, e) => sum + (e.amount || 0),
            0
        );

        // ✅ Opening Balance
        const openingBalance = society.openingBalance || 0;

        // ✅ Final Balance
        const currentBalance =
            openingBalance + totalIncome - totalExpense;

        // ✅ RESPONSE (ONLY EXTENDED)
        res.json({
            openingBalance,
            totalIncome,
            totalExpense,
            currentBalance,
            gifts,
            expenses,
            maintenanceCollections, // existing
            maintenanceDetails      // 🔥 NEW (no impact anywhere)
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
