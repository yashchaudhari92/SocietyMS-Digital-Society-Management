const express = require("express");
const router = express.Router();

const { addFlat, getFlats } = require("../controllers/flatController");

const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const { uploadFlatsExcel, downloadTemplate, downloadFlatsExcel, updateMaintenanceAmount } = require("../controllers/flatController");

// 🔐 Protected
router.post("/add", authMiddleware, isAdmin, addFlat);
router.get("/", authMiddleware, getFlats);

router.post(
    "/upload-excel",
    authMiddleware,
    isAdmin,
    upload.single("file"),
    uploadFlatsExcel
);

router.get("/template", authMiddleware, isAdmin, downloadTemplate);

router.get(
    "/download-excel",
    authMiddleware,
    isAdmin,
    downloadFlatsExcel
);

// router.put("/update-amount/:id", authMiddleware, isAdmin, updateMaintenanceAmount);

module.exports = router;