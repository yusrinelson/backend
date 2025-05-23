const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
} = require("../controllers/productController");

const { protect, restrictTo } = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

//public routes
router.get("/", getAllProducts);
router.get('/:id', getSingleProduct);


//protected routes
router.post("/", protect, restrictTo("seller"), upload.array('thumbnail'),createProduct);
router.patch("/:id", protect, restrictTo("seller"), upload.array('thumbnail'),updateProduct);
router.delete("/:id", protect, restrictTo("seller"), deleteProduct);
router.get('/seller/:sellerId', protect, getProductsBySeller);

module.exports = router;
