const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage} = require("multer-storage-cloudinary");
const multer = require("multer");


//configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    // secure: true
})

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "product-images", //folder name
        allowed_formats: ["jpg", "png", "jpeg", "gif", "svg", "webp"],
        transformation: [{ width: 500, height: 500, crop: "limit" }]
    }
});

const upload = multer({ storage: storage });

module.exports = {
    cloudinary,
    upload
}