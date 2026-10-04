const Society = require("../models/Society");

// Create Society
exports.createSociety = async (req, res) => {
  try {

    const{ name, openingBalance } = req.body;

    const society = await Society.create({
      name,
      openingBalance: Number(openingBalance) || 0, // ✅ NEW
      adminId: req.user.id,
      createdBy: req.user?.id, // optional for now
    });

    res.status(201).json(society);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Societies
exports.getSocieties = async (req, res) => {
  try {
    const societies = await Society.find({
      adminId: req.user.id,
    });
    res.json(societies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};