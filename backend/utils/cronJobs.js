const cron = require("node-cron");
const Payment = require("../models/Payment");
const Flat = require("../models/Flat");

// Run on 1st day of every month at 12:00 AM
cron.schedule("0 0 1 * *", async () => {
  console.log("Running monthly payment generator...");

  const currentMonth = new Date().toISOString().slice(0, 7);

  const flats = await Flat.find();

  for (let flat of flats) {
    const exists = await Payment.findOne({
      flatId: flat._id,
      month: currentMonth,
    });

    if (!exists) {
      await Payment.create({
        flatId: flat._id,
        userId: flat.userId || null,
        adminId: flat.adminId,
        month: currentMonth,
        amount: flat.maintenanceAmount,
      });
    }
  }

  console.log("Monthly payments created");
});