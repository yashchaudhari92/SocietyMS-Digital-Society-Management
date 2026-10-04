const cloudinary = require("./cloudinary");

const uploadToCloudinary = async (filePath) => {
    const result = await cloudinary.uploader.upload(filePath, {
        folder: "societyms/payment-screenshots",
        resource_type: "image",
    });

    return result.secure_url;
};

module.exports = uploadToCloudinary;