const { default: mongoose } = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// get cart by user
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: "items.product",
        select: "title description price thumbnail stock", // Add all fields you need
      })
      .populate({ 
        path: "items.seller",
        select: "name email", // Add seller info if needed
      });

    if (!cart) {
      // Return empty cart structure instead of 404
      return res.status(200).json({
        user: req.user._id,
        items: [],
        costEstimate: {
          subtotal: 0,
          shippingValue: 100,
          discountValue: 0,
          total: 100,
          currency: "ZAR",
        },
      });
    }

    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// add product to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    console.log('Adding product to cart:', productId, quantity, userId);

    if (quantity === undefined || quantity === null) { // More specific check
      return res.status(400).json({ msg: "Quantity required" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    // Check if the requested quantity is available /stock
    if (quantity > product.stock) {
      return res.status(400).json({ msg: "Product out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        costEstimate: {
          subtotal: 0,
          shippingValue: 100, // Default R100
          discountValue: 0,
          total: 0,
          currency: "ZAR",
        },
      });
    }

    // Check if the product is already in the cart
    const existingItemIndex = cart.items.findIndex((item) =>
      item.product.equals(productId)
    );
     console.log('Existing item index:', existingItemIndex);

    if (existingItemIndex > -1) {
       console.log('Updating existing item');
      const existingItem = cart.items[existingItemIndex];

      if (quantity === 0) {
        // remove the item if quantity is 0
        cart.items.splice(existingItemIndex, 1);
      } else {
        // Update the quantity(ensures it doesnt exceed stock)
        existingItem.quantity = Math.min(quantity, product.stock);
        existingItem.priceAtCheckout = product.price; // update price snapshot if needed
        existingItem.seller = product.createdBy?._id || product.createdBy;
      }
    } else if (quantity > 0) {
      console.log('Adding new item');
      cart.items.push({
        product: productId,
        quantity: Math.min(quantity, product.stock),
        seller: product.createdBy?._id || product.createdBy,
        priceAtCheckout: product.price,
      });
    }

    const costEstimate = cart.costEstimate;

    // Recalculate subtotal based on each item's individual priceAtCheckout
    costEstimate.subtotal = cart.items.reduce((sum, item) => {
      return sum + item.quantity * item.priceAtCheckout;
    }, 0);

    // Shipping logic: Free shipping if subtotal > 5000
    costEstimate.shippingValue = costEstimate.subtotal > 5000 ? 0 : 100;

    // dicount logic: 10% discount if you use code DIS25
    if (req.body.discountValue === "DIS25") {
      costEstimate.discountValue = costEstimate.subtotal * 0.3;
    }

    costEstimate.total =
      costEstimate.subtotal -
      costEstimate.discountValue +
      costEstimate.shippingValue;

    await cart.save();

    // Populate the cart before sending it back
    await cart.populate([
      {
        path: "items.product",
        select: "title description price thumbnail stock",
      },
      {
        path: "items.seller",
        select: "name email",
      },
    ]);
    res.json(cart);
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addToCart,
  getCart,
};
