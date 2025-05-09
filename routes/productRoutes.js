const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

router.get("/", getAllProducts);
router.post("/", protect, restrictTo("seller"), createProduct);

router.patch("/:id", protect, restrictTo("seller"), updateProduct);
router.delete("/:id", protect, restrictTo("seller"), deleteProduct);

module.exports = router;
