const Product = require("../models/productModel");

// create product
const createProduct = async (req, res) => {
  const { title, description, price, category } = req.body;

  try {
    const products = await Product.create({
      title,
      description,
      price,
      category,
      createdBy: req.user._id,
    });

    res.status(201).json({ message: "product created successfully", products });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("createdBy", "name");

    res
      .status(200)
      .json({ message: "fetched all products successfully", products });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// update product
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    // Check ownership
    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to update this product" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    return res
      .status(200)
      .json({ message: "product updated successfully", updatedProduct });
  } catch (error) {
    res.status(400).json({ message: "update Failed", error: error.message });
  }
};

// delete product
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "product not found" });
  }
  if (product.createdBy.toString() !== req.user._id.toString()) {
    return res
      .status(403)
      .json({ message: "Not allowed to delete this product" });
  }

  await product.deleteOne();

  res.status(200).json({ message: "product deleted successfully" });
};

module.exports = {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
