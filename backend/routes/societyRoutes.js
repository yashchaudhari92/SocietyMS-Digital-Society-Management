const express = require("express");
const router = express.Router();

const {
  createSociety,
  getSocieties,
} = require("../controllers/societyController");

const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");


router.post("/add", authMiddleware, isAdmin, createSociety);
router.get("/", authMiddleware, getSocieties);

module.exports = router;