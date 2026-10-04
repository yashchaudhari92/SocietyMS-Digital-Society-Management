const express = require("express");
const router = express.Router();

const { addGift, getGifts, deleteGift } = require("../controllers/giftController");

const auth = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");

router.post("/add", auth, isAdmin, addGift);
router.delete("/:id", auth, isAdmin, deleteGift);
router.get("/", auth, isAdmin, getGifts);


module.exports = router;