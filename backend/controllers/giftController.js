const Gift = require("../models/Gift");

// ➕ Add Gift
exports.addGift = async (req, res) => {
    try {
        const gift = await Gift.create({
            ...req.body,
            createdBy: req.user.id,
        });

        res.status(201).json(gift);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteGift = async (req, res) => {
    try {
        const { id } = req.params;

        await Gift.findByIdAndDelete(id);

        res.json({ message: "Gift deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 📄 Get Gifts
exports.getGifts = async (req, res) => {
    try {
        const { societyId } = req.query;

        const gifts = await Gift.find({ societyId }).sort({ createdAt: -1 });

        res.json(gifts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};