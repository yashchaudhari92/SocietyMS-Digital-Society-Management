const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const authRoutes = require("./routes/authRoutes");
const flatRoutes = require("./routes/flatRoutes");
const societyRoutes = require("./routes/societyRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const balanceRoutes = require("./routes/balanceRoutes");
const giftRoutes = require("./routes/giftRoutes");


dotenv.config();
require("./utils/cronJobs");

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static folder for images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/flats", flatRoutes);
app.use("/api/societies", societyRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/gifts", giftRoutes);


const port = process.env.PORT || 3000;

// connect to mongoDB
main().then(() => {
    console.log("Successfully Connected to Database");
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
};

app.get('/', (req, res) => {
    res.send('API Running....!');
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'SocietyMS Backend is running'
    });
});

app.listen(port, () => {
    console.log(`Server is runnig on port ${port}`);
});