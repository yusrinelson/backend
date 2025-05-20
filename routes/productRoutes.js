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

router.get("/", getAllProducts);
router.post("/", protect, restrictTo("seller"), upload.array('images', 5),createProduct);

router.get('/:id', getSingleProduct);
router.patch("/:id", protect, restrictTo("seller"), upload.array('images', 5),updateProduct);
router.delete("/:id", protect, restrictTo("seller"), deleteProduct);
router.get('/seller/:sellerId', protect, getProductsBySeller);

module.exports = router;
