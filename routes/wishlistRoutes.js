// routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const Wishlist = require('../models/wishListModel');
const { protect } = require("../middleware/authMiddleware");

// Get user's wishlist
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products',
        populate: {
          path: 'createdBy',
          select: 'name'
        }
      });

    // If no wishlist exists, create one
    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: []
      });
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product to wishlist
router.post('/add/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        products: [productId]
      });
    } else {
      // Check if product already in wishlist
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
        await wishlist.save();
      }
    }

    // Populate the updated wishlist
    await wishlist.populate({
      path: 'products',
      populate: {
        path: 'createdBy',
        select: 'name'
      }
    });

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove product from wishlist
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        id => id.toString() !== productId
      );
      await wishlist.save();
      
      // Populate the updated wishlist
      await wishlist.populate({
        path: 'products',
        populate: {
          path: 'createdBy',
          select: 'name'
        }
      });
    }

    res.json(wishlist || { products: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear entire wishlist
router.delete('/clear', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    res.json({ message: 'Wishlist cleared', products: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;