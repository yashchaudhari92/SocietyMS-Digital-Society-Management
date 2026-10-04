const Payment = require("../models/Payment");
const Flat = require("../models/Flat");
const User = require("../models/User");
const path = require("path");
const { extractTextFromImage } = require("../utils/googleVision");

// ✅ Create monthly records
exports.createMonthlyPayments = async (req, res) => {
    try {
        const flats = await Flat.find({
            adminId: req.user.id,
        });

        const currentMonth = new Date().toISOString().slice(0, 7);

        for (let flat of flats) {
            const exists = await Payment.findOne({
                flatId: flat._id,
                month: currentMonth,
                adminId: req.user.id,
            });

            if (!exists) {
                await Payment.create({
                    flatId: flat._id,
                    userId: flat.userId || null,
                    adminId: flat.adminId,
                    month: currentMonth,
                    amount: flat.maintenanceAmount,

                    // ✅ ALWAYS PENDING (CORRECT FLOW)
                    paidAmount: 0,
                    remainingAmount: flat.maintenanceAmount,
                    status: "pending",
                });
            }
        }

        res.json({ message: "Monthly records created" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const verifyPaymentScreenshot = async (imagePath) => {
    const text = await extractTextFromImage(imagePath);

    console.log("🔍 OCR TEXT:\n", text);

    let isValid = false;
    let reason = "Payment proof not clear";
    let date = null;

    const cleanText = text.toLowerCase();

    // ✅ Strong validation for UPI apps
    if (
        cleanText.includes("transaction successful") ||
        cleanText.includes("completed") ||
        cleanText.includes("paid to") ||
        cleanText.includes("received from") ||
        cleanText.includes("upi") ||
        cleanText.includes("transaction id")
    ) {
        isValid = true;
        reason = "Valid UPI payment detected";
    } else {
        reason = "No valid payment keywords found";
    }

    // date extraction (keep same)
    const dateMatch =
        text.match(/\d{1,2}[\s/-][a-zA-Z]{3,9}[\s/-]\d{2,4}/) ||
        text.match(/\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/);

    if (dateMatch) {
        date = dateMatch[0];
    }

    return { isValid, date, text, reason };
};

// ✅ Upload payment screenshot (Admin-based distribution)
exports.uploadPayment = async (req, res) => {
    try {
        const { paymentId } = req.body;

        const payment = await Payment.findById(paymentId);
        payment.screenshot = req.file.path;
        payment.paymentMethod = "online";   // New added line 
        await payment.save();

        const fullPath = path.join(__dirname, "..", req.file.path);
        // ✅ OCR Verify (existing)
        const { isValid, date, text, reason } = await verifyPaymentScreenshot(fullPath);

        if (!isValid) {
            payment.status = "rejected";
            payment.paymentDate = new Date();
            await payment.save();

            return res.json({
                message: "Invalid payment proof",
                status: payment.status,
                reason,
                extractedText: text,
            });
        }

        let paidAmount = 0;

        // 🔥 FIX: remove comma (₹1,000 → ₹1000)
        let cleanText = text.replace(/,/g, "").replace(/[€*]/g, "₹").toLowerCase();


        // 🥇 STEP 1: Extract ₹ amounts (BEST SOURCE)
        let currencyMatches = cleanText.match(/₹\s?(\d{2,6})/g);

        if (currencyMatches) {
            let amounts = currencyMatches.map(m =>
                parseInt(m.replace(/[^\d]/g, ""))
            );

            // 🔥 FIX: remove invalid values (UTR fragments etc.)
            amounts = amounts.filter(n =>
                n >= 50 &&
                n <= 20000 &&
                n.toString().length <= 5
            );

            if (amounts.length > 0) {
                paidAmount = Math.max(...amounts);
            }
        }


        // 🥈 STEP 2: fallback (big standalone numbers)
        if (!paidAmount) {

            const lines = cleanText.split("\n");

            let numbers = [];

            for (let line of lines) {

                // 🔥 FIX: skip dangerous lines (UTR / transaction)
                if (
                    line.includes("utr") ||
                    line.includes("transaction id") ||
                    line.includes("credited to") ||
                    line.includes("xxxx") ||
                    line.includes("bank") ||
                    line.includes("id")
                ) continue;

                let nums = line.match(/\d{2,6}/g);

                if (nums) {
                    nums.forEach(n => {
                        const num = Number(n);

                        // 🔥 EXTRA SAFETY: ignore numbers from long sequences
                        if (n.length > 5) return;

                        numbers.push(num);
                    });
                }
            }

            if (numbers.length > 0) {

                // ❌ REMOVE NOISE
                numbers = numbers.filter(n =>
                    n >= 50 &&
                    n <= 20000 &&
                    n !== 2026 &&
                    n !== 2025 &&
                    n !== 24 &&
                    n !== 22 &&
                    n !== 20 &&
                    n !== 9 &&
                    n !== 53
                );

                // ❌ remove transaction IDs (too long)
                numbers = numbers.filter(n => n.toString().length <= 5);

                if (numbers.length > 0) {
                    paidAmount = Math.max(...numbers);
                }
            }
        }


        // 🥉 FINAL SAFETY
        if (paidAmount < 50 || paidAmount > 20000) {
            paidAmount = 0;
        }

        console.log("✅ FINAL DETECTED AMOUNT:", paidAmount);

        let appliedMonths = []; // 🔥 NEW
        // 🔥 MAIN LOGIC
        if (paidAmount) {

            let remaining = paidAmount;

            // ✅ INIT CURRENT PAYMENT
            if (!payment.paidAmount) payment.paidAmount = 0;
            if (!payment.remainingAmount) payment.remainingAmount = payment.amount;



            // 🔥 DISTRIBUTE TO OTHER MONTHS
            const pendingPayments = await Payment.find({
                flatId: payment.flatId,
                _id: { $ne: payment._id },
                status: { $ne: "approved" } // 🔥 ONLY pending
            }).sort({ month: 1 });


            for (let p of pendingPayments) {
                if (remaining <= 0) break;

                if (!p.paidAmount) p.paidAmount = 0;
                if (!p.remainingAmount) p.remainingAmount = p.amount;

                if (p.remainingAmount === 0) continue;

                const due = p.amount - p.paidAmount;

                if (remaining >= due) {
                    p.paidAmount += due;
                    p.remainingAmount = 0;
                    remaining -= due;
                    p.status = "approved";
                } else {
                    p.paidAmount += remaining;
                    p.remainingAmount = p.amount - p.paidAmount;
                    remaining = 0;
                    p.status = "pending";
                }

                appliedMonths.push(p.month);

                if (p.remainingAmount === 0) {
                    p.status = "approved";
                }

                p.screenshot = req.file.path;
                p.paymentDate = new Date();

                await p.save();
            }

            // 🔥 ✅ FIX: APPLY TO CURRENT IF STILL REMAINING
            if (remaining > 0) {

                if (!payment.paidAmount) payment.paidAmount = 0;
                if (!payment.remainingAmount) payment.remainingAmount = payment.amount;

                const due = payment.amount - payment.paidAmount;

                if (remaining >= due) {
                    payment.paidAmount += due;
                    payment.remainingAmount = 0;
                    remaining -= due;
                    payment.status = "approved";
                } else {
                    payment.paidAmount += remaining;
                    payment.remainingAmount = payment.amount - payment.paidAmount;
                    remaining = 0;
                    payment.status = "pending";
                }

                appliedMonths.push(payment.month);
            }
        }

        payment.paymentDate = new Date();
        await payment.save();

        // 🔥 fetch latest updated record
        const updatedPayment = await Payment.findById(payment._id);

        res.json({
            message: "Payment uploaded",
            status: updatedPayment.status, // ✅ FIX HERE
            reason,
            extractedText: text,
            appliedMonths,
        });


    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });
    }
};

// New cash Payment Function 
exports.addCashPayment = async (req, res) => {
    try {
        const { flatId, amount } = req.body;

        let remaining = Number(amount);

        const payments = await Payment.find({
            flatId,
            status: { $ne: "approved" },
        }).sort({ month: 1 });

        let appliedMonths = [];

        for (let p of payments) {
            if (remaining <= 0) break;

            if (!p.paidAmount) p.paidAmount = 0;
            if (!p.remainingAmount) p.remainingAmount = p.amount;

            const due = p.amount - p.paidAmount;

            if (remaining >= due) {
                p.paidAmount += due;
                p.remainingAmount = 0;
                remaining -= due;
                p.status = "approved";
            } else {
                p.paidAmount += remaining;
                p.remainingAmount = p.amount - p.paidAmount;
                remaining = 0;
                p.status = "pending";
            }

            p.paymentMethod = "cash"; // 🔥 KEY LINE
            p.paymentDate = new Date();

            appliedMonths.push(p.month);

            await p.save();
        }

        res.json({
            message: "Cash payment added",
            appliedMonths,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// ✅ Admin view all payments
exports.getAllPayments = async (req, res) => {
    try {
        const { month, societyId, wing } = req.query;

        let filter = {
            adminId: req.user.id,
        };

        if (month && month.trim() !== "") {
            filter.month = month;
        }

        const paymentsRaw = await Payment.find(filter).populate("flatId");

        // 🔥 GET ALL FLATS
        let flatFilter = {
            adminId: req.user.id,
        };

        if (societyId && societyId !== "") {
            flatFilter.societyId = societyId;
        }

        const allFlats = await Flat.find(flatFilter);

        let payments = societyId && societyId !== ""
            ? paymentsRaw.filter(
                (p) =>
                    p.flatId &&
                    p.flatId.societyId &&
                    p.flatId.societyId.toString() === societyId
            )
            : paymentsRaw;

        // 🔥 CREATE MAP OF FLAT PAYMENTS
        const flatPaymentMap = {};

        payments.forEach((p) => {
            if (p.flatId) {
                flatPaymentMap[p.flatId._id.toString()] = true;
            }
        });

        // 🔥 NEW: wing filter
        if (wing && wing !== "") {
            payments = payments.filter(
                (p) =>
                    p.flatId &&
                    p.flatId.wing === wing
            );
        }

        // 🔥 EXISTING LOGIC (UNCHANGED)
        const balances = {};

        payments.forEach((p) => {
            const flatId = p.flatId._id.toString();

            if (!balances[flatId]) {
                balances[flatId] = 0;
            }

            if (p.status !== "approved") {
                balances[flatId] += p.remainingAmount || p.amount;
            }
        });

        // 🔥 ADD FLATS WITHOUT PAYMENTS (ONLY BEFORE GENERATE)
        allFlats.forEach((flat) => {
            const flatId = flat._id.toString();

            if (!flatPaymentMap[flatId]) {

                const isZeroPending = flat.pendingAmount === 0;

                payments.push({
                    _id: null, // virtual
                    flatId: flat,
                    month: null,
                    amount: isZeroPending ? 0 : flat.maintenanceAmount,
                    paidAmount: 0,
                    remainingAmount: isZeroPending ? 0 : flat.maintenanceAmount,
                    status: isZeroPending ? "approved" : "pending",
                });
            }
        });

        // ✅🔥 REMOVE VIRTUAL ROWS IF REAL PAYMENTS EXIST (MAIN FIX)
        const flatsWithRealPayments = new Set(
            payments
                .filter(p => p._id !== null)
                .map(p => p.flatId._id.toString())
        );

        payments = payments.filter(p => {
            const flatId = p.flatId._id.toString();

            // keep real always
            if (p._id !== null) return true;

            // keep virtual only if no real exists
            return !flatsWithRealPayments.has(flatId);
        });

        // 🔥 GROUP BY FLAT
        const grouped = {};

        payments.forEach((p) => {
            const flatId = p.flatId._id.toString();

            if (!grouped[flatId]) {
                grouped[flatId] = [];
            }

            grouped[flatId].push(p);
        });

        const currentMonth = new Date().toISOString().slice(0, 7);

        const finalData = [];

        Object.values(grouped).forEach((flatPayments) => {

            const realPayments = flatPayments.filter(p => p._id !== null);
            const virtualPayments = flatPayments.filter(p => p._id === null);

            // sort only real
            realPayments.sort((a, b) => b.month.localeCompare(a.month));

            let current = realPayments.find(p => p.month === currentMonth);

            if (!current && realPayments.length > 0) {
                current = realPayments[0];
            }

            if (!current && virtualPayments.length > 0) {
                current = virtualPayments[0];
            }

            const totalBalance = realPayments.reduce((sum, p) => {
                if (p.status !== "approved") {
                    return sum + (p.remainingAmount || p.amount);
                }
                return sum;
            }, 0);

            const totalPaid = realPayments.reduce((sum, p) => {
                return sum + (p.paidAmount || 0);
            }, 0);

            finalData.push({
                ...(current._doc || current),
                balance: totalBalance,
                totalPaid,
            });
        });

        res.json(finalData);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all the user payments
exports.getUserPayments = async (req, res) => {
    try {
        const { month } = req.query;

        const user = await User.findById(req.user.id);

        const flat = await Flat.findOne({
            contactNumber: user.contactNumber,
        });

        if (!flat) return res.json([]);

        let filter = {
            flatId: flat._id,
        };

        if (month) {
            filter.month = month;
        }

        const payments = await Payment.find(filter);

        res.json(payments);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Admin approve/reject
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const payment = await Payment.findById(id);

        payment.status = status;

        await payment.save();

        res.json({ message: "Status updated" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Monthly collection + remaining (Wing wise)
exports.getMonthlySummary = async (req, res) => {
    try {
        const { month, societyId } = req.query;

        let filter = {
            adminId: req.user.id,
        };

        // ✅ SAFE month check
        if (month && month.trim() !== "") {
            filter.month = month;
        }

        const paymentsRaw = await Payment.find(filter).populate("flatId");

        // ✅ SAFE society filter (payments)
        const payments = societyId && societyId !== ""
            ? paymentsRaw.filter(
                (p) =>
                    p.flatId &&
                    p.flatId.societyId &&
                    p.flatId.societyId.toString() === societyId
            )
            : paymentsRaw;

        let summary = {};

        // ✅ EXISTING LOGIC (collected + total for ALL-TIME case)
        payments.forEach((p) => {
            if (!p.flatId) return;

            const wing = p.flatId.wing;

            if (!summary[wing]) {
                summary[wing] = {
                    total: 0,
                    collected: 0,
                };
            }

            // 🔥 IMPORTANT: keep this for ALL-TIME calculation
            summary[wing].total += p.amount;

            if (p.status === "approved") {
                summary[wing].collected += p.amount;
            }
        });

        // 🔥 GET FLATS (for monthly correct total)
        let flatFilter = {
            adminId: req.user.id,
        };

        if (societyId && societyId !== "") {
            flatFilter.societyId = societyId;
        }

        const flats = await Flat.find(flatFilter);

        let flatSummary = {};

        flats.forEach((f) => {
            const wing = f.wing;

            if (!flatSummary[wing]) {
                flatSummary[wing] = 0;
            }

            flatSummary[wing] += f.maintenanceAmount;
        });

        // 🔥 FINAL TOTAL LOGIC (MONTH AWARE)
        Object.keys(summary).forEach((wing) => {
            if (month && month.trim() !== "") {
                // ✅ Monthly → fixed using flats
                summary[wing].total = flatSummary[wing] || 0;
            } else {
                // ✅ All-time → keep payments total (already calculated)
                // do nothing
            }
        });

        // 🔥 Ensure wings with flats but no payments are included
        Object.keys(flatSummary).forEach((wing) => {
            if (!summary[wing]) {
                summary[wing] = {
                    total: month && month.trim() !== "" ? flatSummary[wing] : 0,
                    collected: 0,
                };
            }
        });

        // remaining (UNCHANGED)
        Object.keys(summary).forEach((wing) => {
            summary[wing].remaining =
                summary[wing].total - summary[wing].collected;
        });

        const flatsWithStatus = flats.map((f) => {
            const flatPayments = payments.filter(
                (p) =>
                    p.flatId &&
                    p.flatId._id.toString() === f._id.toString()
            );

            const hasPending = flatPayments.some(
                (p) => p.status !== "approved"
            );

            return {
                flatId: f._id,
                wing: f.wing,
                flatNo: f.flatNo,
                ownerName: f.ownerName,
                occupantType: f.occupantType,
                flatType: f.flatType,
                amount: f.maintenanceAmount,
                status: hasPending ? "pending" : "approved", // ✅ FIX
            };
        });

        // ✅ FINAL RESPONSE
        res.json({
            summary,
            flats: flatsWithStatus,
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ✅ Get payment history for a flat
exports.getPaymentHistory = async (req, res) => {
    try {
        const { flatId } = req.params;

        const payments = await Payment.find({
            flatId,
            adminId: req.user.id,
        }).sort({ month: 1 });

        res.json(payments);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};