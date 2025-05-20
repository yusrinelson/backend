const { default: mongoose } = require("mongoose");
const Product = require("../models/productModel");
const {cloudinary} = require('../config/cloudinary');

// create product
const createProduct = async (req, res) => {
  const { title, description, price, category, stock } = req.body;

  // Handle uploaded images (from multer middleware)
  let uploadImages = [];
  let thumbnailUrl = '';

  //process uploadedImages if they exist
  if(req.files && req.files.length > 0) {
    uploadImages = req.files.map(file => {
      return {
        url: file.path, //cloudinary return the URL in the path property
        alt: title || 'Product Image',
      }
    })

    // use the first image as the thumbnail
    thumbnailUrl = req.files[0].path;
  }

  try {
    const products = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      images: uploadImages,
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
  
  // Handle uploaded images if any
    if (req.files && req.files.length > 0) {
      // Map the files to our image schema format
      const uploadedImages = req.files.map(file => ({
        url: file.path,
        alt: req.body.title || product.title || 'Product image'
      }));
      
      // Update images and thumbnail
      updateData.images = uploadedImages;
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
    if (product.images && product.images.length > 0) {
      // Extract public IDs from image URLs
      // Cloudinary URL format: https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/product-images/abc123.jpg
      const imagePublicIds = product.images.map(img => {
        const parts = img.url.split('/');
        // Get the file name with extension
        const fileWithExtension = parts[parts.length - 1];
        // Get just the file name without extension
        const publicId = `product-images/${fileWithExtension.split('.')[0]}`;
        return publicId;
      });

      // Delete images from Cloudinary (this is optional but recommended)
      // Note: This uses Promise.allSettled to continue even if some deletions fail
      await Promise.allSettled(
        imagePublicIds.map(publicId => cloudinary.uploader.destroy(publicId))
      );
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
