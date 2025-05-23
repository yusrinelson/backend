const { default: mongoose } = require("mongoose");
const Product = require("../models/productModel");
const {cloudinary} = require('../config/cloudinary');

// create product
const createProduct = async (req, res) => {
  const { title, description, price, category, stock } = req.body;

  // Handle uploaded thumbnail/image (from multer middleware)
  let thumbnailUrl = '';

  //process uploadedImages if they exist
  if(req.files && req.files.length > 0) {
    // use the first image as the thumbnail
    thumbnailUrl = req.files[0].path; // Cloudinary returns the URL in the path property
  }

  try {
    const products = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      thumbnail: thumbnailUrl,
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

// get single product
const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name"
    );

    if (!product) {
      return res.status(404).json({ message: "product not found" });
    } else {
      res
        .status(200)
        .json({ message: "fetched product successfully", product });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// update product
const updateProduct = async (req, res) => {
  const updateData = {...req.body};

  // Handle uploaded images if any
     if (req.files && req.files.length > 0) {
      // Before updating with a new thumbnail, consider deleting the old one from Cloudinary
      // to avoid orphaned images and save storage.
      try {
        const productToUpdate = await Product.findById(req.params.id);
        if (productToUpdate && productToUpdate.thumbnail) {
          const parts = productToUpdate.thumbnail.split('/');
          // Assuming public_id is like 'product-images/filename'
          const fileWithExtension = parts[parts.length - 1];
          const publicId = `product-images/${fileWithExtension.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
          console.log(`Old thumbnail ${publicId} deleted from Cloudinary.`);
        }
      } catch (cloudError) {
        console.error("Error deleting old thumbnail from Cloudinary:", cloudError);
        // Do not block the update if old image deletion fails
      }

      // Update thumbnail with the new one
      updateData.thumbnail = req.files[0].path;
    }

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
      updateData,
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
   try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not allowed to delete this product" });
    }

    // Optional: Delete images from Cloudinary
    // This is a good practice to clean up resources
    if (product.thumbnail) {
      // Extract public IDs from image URLs
      // Cloudinary URL format: https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/product-images/abc123.jpg
        const parts =product.thumbnail.split('/');
        const fileWithExtension = parts[parts.length - 1];// Get the file name with extension
        const publicId = `product-images/${fileWithExtension.split('.')[0]}`;  // Get just the file name without extension
        await cloudinary.uploader.destroy(publicId).catch(err => {
        console.error("Failed to delete thumbnail from Cloudinary:", err);
      });
    }

    await product.deleteOne();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(400).json({ message: "Delete failed", error: error.message });
  }
};


// Get products by seller ID
const getProductsBySeller = async (req, res) => {
  try {
      const { sellerId } = req.params; // Use a clear parameter name

      // Validate if sellerId is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
          return res.status(400).json({ message: 'Invalid seller ID format.' });
      }

      // Optional: Check if the requesting user is authorized to view these products
      // Assuming req.user contains the decoded JWT with user ID and role
      if (req.user.role !== 'seller' && req.user._id !== sellerId) {
          return res.status(403).json({ message: 'Unauthorized: You can only view your own products.' });
      }

      // Fetch products where createdBy matches the sellerId
      const products = await Product.find({ createdBy: sellerId });

      if (products.length === 0) {
          return res.status(200).json({
              message: 'No products found for this seller.',
              products: []
          });
      }

      res.status(200).json({
          message: 'Fetched products by seller successfully.',
          products
      });
  } catch (error) {
      console.error('Error fetching products by seller:', error);
      res.status(500).json({ message: 'Server error while fetching products. Please try again later.' });
  }
};
module.exports = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
};
