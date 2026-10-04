const Flat = require("../models/Flat");
const User = require("../models/User");
const XLSX = require("xlsx");
const Society = require("../models/Society");
const maintenanceConfig = require("../utils/maintenanceConfig");

// Add Flat
exports.addFlat = async (req, res) => {
  try {
    const {
      societyId,
      wing,
      flatNo,
      ownerName,
      flatType,
      occupantType,
      contactNumber,
      pendingAmount,
    } = req.body;

    const type = flatType?.toUpperCase();
    const occ = occupantType?.toLowerCase();

    let maintenanceAmount = 1000;

    if (maintenanceConfig[type] && maintenanceConfig[type][occ]) {
      maintenanceAmount = maintenanceConfig[type][occ];
    }

    const exists = await Flat.findOne({
      societyId,
      wing,
      flatNo,
    });

    if (exists) {
      return res.status(400).json({
        message: "Flat already exists",
      });
    }

    const flat = await Flat.create({
      societyId,
      adminId: req.user.id,
      wing,
      flatNo,
      ownerName,
      flatType,
      occupantType,
      maintenanceAmount,
      contactNumber,
      pendingAmount: Number(pendingAmount || 0),
    });

    // 🔥 NEW: CREATE PAYMENTS FROM AMOUNT
    const Payment = require("../models/Payment");

    if (pendingAmount > 0) {
      let remaining = Number(pendingAmount);
      const currentDate = new Date();
      let i = 1;

      while (remaining > 0) {
        const d = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );

        const monthStr = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;

        const amountToApply = Math.min(remaining, maintenanceAmount);

        await Payment.create({
          flatId: flat._id,
          adminId: flat.adminId,
          userId: flat.userId || null,
          month: monthStr,
          amount: maintenanceAmount,
          remainingAmount: amountToApply,
          paidAmount: 0,
          status: "pending",
        });

        remaining -= amountToApply;
        i++;
      }
    }

    res.status(201).json(flat);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 📥 Bulk Upload Flats via Excel
exports.uploadFlatsExcel = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ message: "File not uploaded" });
    }

    const filePath = req.file.path;
    const { societyId } = req.body;

    if (!societyId) {
      return res.status(400).json({ message: "Society required" });
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    let flats = [];

    for (let row of data) {

      const type = row.flatType?.toUpperCase();
      const occ = row.occupantType?.toLowerCase();

      let maintenanceAmount = 1000;

      if (maintenanceConfig[type] && maintenanceConfig[type][occ]) {
        maintenanceAmount = maintenanceConfig[type][occ];
      }

      flats.push({
        societyId,
        adminId: req.user.id,
        wing: row.wing,
        flatNo: row.flatNo,
        ownerName: row.ownerName,
        flatType: row.flatType,
        occupantType: row.occupantType,
        maintenanceAmount,
        contactNumber: row.contactNumber,
        pendingAmount: Number(row.pendingAmount || 0), // 🔥 NEW
      });
    }

    let inserted = 0;
    let skipped = 0;

    for (let flat of flats) {
      const exists = await Flat.findOne({
        societyId: flat.societyId,
        wing: flat.wing,
        flatNo: flat.flatNo,
      });

      if (exists) {
        skipped++;
        continue;
      }

      const createdFlat = await Flat.create(flat);
      inserted++;

      // 🔥 CREATE PAYMENTS FROM AMOUNT
      const Payment = require("../models/Payment");

      if (flat.pendingAmount > 0) {
        let remaining = flat.pendingAmount;
        const currentDate = new Date();
        let i = 1;

        while (remaining > 0) {
          const d = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - i,
            1
          );

          const monthStr = `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`;

          const amountToApply = Math.min(
            remaining,
            createdFlat.maintenanceAmount
          );

          await Payment.create({
            flatId: createdFlat._id,
            adminId: createdFlat.adminId,
            userId: createdFlat.userId || null,
            month: monthStr,
            amount: createdFlat.maintenanceAmount,
            remainingAmount: amountToApply,
            paidAmount: 0,
            status: "pending",
          });

          remaining -= amountToApply;
          i++;
        }
      }
    }

    res.json({
      message: "Flats uploaded",
      inserted,
      skipped,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadTemplate = (req, res) => {
  const XLSX = require("xlsx");

  const data = [
    {
      wing: "A",
      flatNo: "101",
      ownerName: "John Doe",
      flatType: "2BHK",
      occupantType: "owner",
      contactNumber: "9999999999",
      pendingAmount: "0", // 🔥 UPDATED
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Flats");

  const filePath = "uploads/flat_template.xlsx";
  XLSX.writeFile(wb, filePath);

  res.download(filePath);
};

// 📥 Download Flats Excel (Wing-wise sheets)
exports.downloadFlatsExcel = async (req, res) => {
  try {
    const { societyId } = req.query;

    if (!societyId) {
      return res.status(400).json({ message: "Society required" });
    }

    const flats = await Flat.find({
      adminId: req.user.id,
      societyId,
    });

    if (flats.length === 0) {
      return res.status(404).json({ message: "No flats found" });
    }

    const grouped = {};

    flats.forEach((f) => {
      if (!grouped[f.wing]) {
        grouped[f.wing] = [];
      }

      grouped[f.wing].push({
        wing: f.wing,
        flatNo: f.flatNo,
        ownerName: f.ownerName,
        flatType: f.flatType,
        occupantType: f.occupantType,
        contactNumber: f.contactNumber,
        amount: f.maintenanceAmount,
      });
    });

    const wb = XLSX.utils.book_new();

    Object.keys(grouped).forEach((wing) => {
      const ws = XLSX.utils.json_to_sheet(grouped[wing]);
      XLSX.utils.book_append_sheet(wb, ws, `Wing-${wing}`);
    });

    const society = await Society.findById(societyId);

    const fileName = `${society.name}_flats.xlsx`;
    const filePath = `uploads/${fileName}`;

    XLSX.writeFile(wb, filePath);

    res.download(filePath);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get All Flats (Society-wise filter)
exports.getFlats = async (req, res) => {
  try {
    const { societyId } = req.query;

    let filter = {
      adminId: req.user.id,
    };

    if (societyId) {
      filter.societyId = societyId;
    }

    const flats = await Flat.find(filter);

    res.json(flats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// // 🔥 UPDATE MAINTENANCE AMOUNT (NEW)
// exports.updateMaintenanceAmount = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { maintenanceAmount } = req.body;

//     const flat = await Flat.findById(id);

//     if (!flat) {
//       return res.status(404).json({ message: "Flat not found" });
//     }

//     flat.maintenanceAmount = Number(maintenanceAmount);
//     await flat.save();

//     res.json({ message: "Maintenance updated successfully", flat });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };