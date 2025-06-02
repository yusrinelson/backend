const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // The customer of the order
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true, // Critical for multi-seller platforms
        },
        priceAtCheckout: {
          type: Number,
          required: true, // Snapshot of product price at time of order
        },
      },
    ],
    costEstimate: {
      subtotal: {
        type: Number,
        default: 0,
      },
      shippingValue: {
        type: Number,
        default: 0,
      },
      discountValue: {
        type: Number,
        default: 0,
      },
      discountCode: {
        type: String,
      },
      total: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "ZAR",
      },
    },
  },
  { timestamps: true }
);

// Add a virtual to calculate VAT (15% in South Africa)
// cartSchema.virtual('costEstimate.vatAmount').get(function() {
//   return this.costEstimate.subtotal * 0.15;
// });

module.exports = mongoose.model("Cart", cartSchema);