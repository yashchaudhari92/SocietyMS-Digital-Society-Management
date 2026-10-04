const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");

const { getBalance } = require("../controllers/balanceController");

router.get("/:societyId", auth, isAdmin, getBalance);

module.exports = router;