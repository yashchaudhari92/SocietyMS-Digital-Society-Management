const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const { name, email, password, contactNumber, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            contactNumber,
            role,
        });

        res.status(201).json({ message: "User registered", user });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Enter valid login credentials" });
        }

        // 🔥 IMPORTANT: Role check
        // if (user.role !== role) {
        //     return res.status(401).json({ message: "Unauthorized role" });
        // }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );

            res.json({ token, user });
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
