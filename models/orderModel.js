const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, // The customer of the order
    },
    customerName: {
        type: String,
        required: true, // For quick reference in seller dashboard
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true, // unique number for each order
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
            }
        }
    ],
    costDetails: {
        subtotal: { type: Number, required: true }, // Sum of item prices * quantities
        shippingCost: { type: Number, default: 0 },
        vat: { type: Number, default: 0 }, // Renamed from 'tax' to reflect South African VAT
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true }, // Final amount in ZAR
        currency: { type: String, default: "ZAR" } 
    },
    status: {
        type: String,
        enum: ["pending", "processing", "shipped", "delivered", "completed", "cancelled", "returned"],
        default: "pending",
    },
    shippingAddress: {
        type: {
            street: { type: String, required: true },
            city: { type: String, required: true },
            province: { type: String, required: true }, 
            postalCode: { type: String, required: true },
            country: { type: String, default: "South Africa", required: true } // Default to SA
        },
        required: true
    },
    shipping: {
        method: { type: String, required: false }, // e.g., "Standard", "Express"
        carrier: { 
            type: String, 
            required: false,
            enum: ["SAPO", "CourierIT", "Aramex", "DHL", "FedEx", "UPS", "Other"] // South African carriers
        },
        trackingNumber: { type: String, required: false },
        estimatedDelivery: { type: Date, required: false }, // Estimated delivery date
        shippedDate: { type: Date, required: false }, // Date when the order was shipped
        deliveredDate: { type: Date, required: false } // Date when the order was delivered
    },
    payment: {
        method: { type: String, required: false }, // e.g., "Credit Card", "EFT", "PayPal"
        status: { 
            type: String, 
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending"
        },
        transactionId: { type: String, required: false }, // Transaction reference from payment gateway
        paymentDate: { type: Date, required: false } // Date when payment was made
    },
    notes: {
        type: String,
        required: false // Any additional notes or comments about the order
    },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);