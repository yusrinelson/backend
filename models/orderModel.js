const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deliveryInfo: {
      fullName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      province: {
        type: String,
        required: true,
      },
      notes: {
        type: String,
        default: "",
      },
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
          required: true,
        },
        priceAtCheckout: {
          type: Number,
          required: true,
        },
        itemStatus: {
          type: String,
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          default: "pending",
        },
        trackingNumber: String,
        shippedDate: Date,
        deliveredDate: Date,
      },
    ],
    costEstimate: {
      subtotal: {
        type: Number,
        required: true,
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
        required: true,
      },
      currency: {
        type: String,
        default: "ZAR",
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "partially_delivered", "delivered", "completed","partially_completed", "cancelled"],
      default: "pending",
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ["credit_card", "debit_card", "paypal", "eft"],
        default: "credit_card",
      },
      paidAt: {
        type: Date,
      },
      transactionId: {
        type: String,
      },
    },
    deliveryDetails: {
      address: {
        type: String,
      },
      phoneNumber: {
        type: String,
      },
      expectedDeliveryDate: {
        type: Date,
      },
    },
    // ADD: Status tracking
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
