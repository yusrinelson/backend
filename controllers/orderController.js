const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");

const createOrderFromCart = async (req, res) => {
  try {
    console.log("Full request body:", req.body); // Add this line
    console.log("Request body keys:", Object.keys(req.body)); // Add this line

    const userId = req.user._id;
    const { deliveryInfo } = req.body;
    console.log("Creating order for user:", userId);

    console.log("Creating order for user:", userId);
    console.log("Delivery info received:", deliveryInfo); // Add this line

    // Validate deliveryInfo
    if (!deliveryInfo) {
      return res
        .status(400)
        .json({ error: "Delivery information is required" });
    }

    //getting the cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    console.log("Cart found:", cart);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    //stock check and update product quantities
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      console.log(
        "Checking product:",
        product.title,
        "Stock:",
        product.stock,
        "Requested:",
        item.quantity
      );

      if (!product) {
        return res.status(400).json({
          error: `Product not found`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Product ${product.title} is out of stock. Available stock: ${product.stock}`,
        });
      }

      product.stock -= item.quantity;
      await product.save();
    }

    // Generate unique order number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderNumber = `ORD-${timestamp}-${random}`;

    //create order
    const newOrder = new Order({
      orderNumber: orderNumber, // Add this
      user: userId,
      items: cart.items.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
        seller: item.seller,
        priceAtCheckout: item.priceAtCheckout || item.product.price,
        itemStatus: "pending",
      })),
      costEstimate: {
        subtotal: cart.costEstimate.subtotal,
        shippingValue: cart.costEstimate.shippingValue,
        discountValue: cart.costEstimate.discountValue,
        discountCode: cart.costEstimate.discountCode,
        total: cart.costEstimate.total,
        currency: cart.costEstimate.currency || "ZAR",
      },
      deliveryInfo,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          note: "Order created",
        },
      ],
    });

    console.log("Order to be created:", newOrder);
    await newOrder.save();

    //clear cart
    cart.items = [];
    cart.costEstimate = {
      subtotal: 0,
      shippingValue: 0,
      discountValue: 0,
      discountCode: null,
      total: 0,
      currency: "ZAR",
    };
    await cart.save();

    // Populate the order before sending response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("items.product")
      .populate("items.seller", "name email");

    return res.status(201).json({
      message: "Order placed successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Detailed error creating order:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Server error while creating order" });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Fetching orders for user:", userId);

    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .populate("items.seller", "name email")
      .sort("-createdAt");

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ error: "Server error while fetching orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { orderId } = req.params;
    console.log("Fetching order:", orderId, "for user:", userId);

    const order = await Order.findOne({
      _id: orderId,
      user: userId,
    })
      .populate("items.product")
      .populate("items.seller", "name email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    res.status(500).json({ error: "Server error while fetching order" });
  }
};

//SELLER CONTROLLERS BELOW

// Get all orders for a seller
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user._id;
    console.log("Fetching orders for seller:", sellerId);

    //find all orders that contain items from this seller
    const orders = await Order.find({
      "items.seller": sellerId,
    })
      .populate("user", "name email")
      .populate("items.product")
      .populate("items.seller", "name email")
      .sort("-createdAt");

    //Filter to only show items from this seller and calculate specific totals
    const sellerOrders = orders.map((order) => {
      const sellerItems = order.items.filter(
        (item) => item.seller._id.toString() === sellerId.toString()
      );

      // Include all items but mark which ones belong to seller
      const allItemsWithOwnership = order.items.map(item => ({
        ...item.toObject(),
        isSellerItem: item.seller._id.toString() === sellerId.toString(),
        canUpdate: item.seller._id.toString() === sellerId.toString() && 
                   ['pending', 'processing', 'shipped'].includes(item.itemStatus || 'pending')
      }));

      const sellerSubtotal = sellerItems.reduce(
        (sum, item) => sum + (item.priceAtCheckout * item.quantity), 0
      );

      // return {
      //   _id: order._id,
      //   orderNumber: order.orderNumber,
      //   user: order.user,
      //   items: allItemsWithOwnership, // Show all items with ownership info
      //   costEstimate: {
      //     subtotal: sellerSubtotal,
      //     shippingValue: order.costEstimate.shippingValue,
      //     discountValue: order.costEstimate.discountValue,
      //     discountCode: order.costEstimate.discountCode,
      //     total: order.costEstimate.total,
      //     currency: order.costEstimate.currency,
      //   },
      //   deliveryInfo: order.deliveryInfo,
      //   overallStatus: order.status, // Overall order status
      //   hasMultipleSellers: new Set(order.items.map(item => item.seller.toString())).size > 1,
      //   statusHistory: order.statusHistory,
      //   createdAt: order.createdAt,
      //   updatedAt: order.updatedAt,
      // };
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        user: order.user,
        items: allItemsWithOwnership, // Show all items with ownership info
        sellerItemsCount: sellerItems.length,
        totalItemsCount: order.items.length,
        costEstimate: {
          subtotal: sellerSubtotal,
          total: order.costEstimate.total,
          currency: order.costEstimate.currency,
        },
        deliveryInfo: order.deliveryInfo,
        overallStatus: order.status, // Overall order status
        hasMultipleSellers: new Set(order.items.map(item => item.seller.toString())).size > 1,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

    });
    res.status(200).json(sellerOrders);
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    res
      .status(500)
      .json({ error: "Server error while fetching seller orders" });
  }
};

// Get status history for a specific item
const getItemStatusHistory = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const sellerId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const item = order.items.find(
      item => item._id.toString() === itemId && 
              item.seller.toString() === sellerId.toString()
    );

    if (!item) {
      return res.status(403).json({ error: "Item not found or unauthorized" });
    }

    res.json({
      itemId: item._id,
      currentStatus: item.itemStatus || 'pending',
      trackingNumber: item.trackingNumber,
      shippedDate: item.shippedDate,
      deliveredDate: item.deliveredDate,
      product: item.product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//function to update order status
const updateOrderStatus = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { orderId } = req.params;
    const { itemId, status, note, trackingNumber } = req.body;

    console.log("Updating item status:", { orderId, itemId, status, sellerId });

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Find the specific item that belongs to this seller
    const itemIndex = order.items.findIndex(
      (item) =>
        item._id.toString() === itemId &&
        item.seller.toString() === sellerId.toString()
    );

    if (itemIndex === -1) {
      return res.status(403).json({ 
        error: "Item not found or you're not authorized to update this item" 
      });
    }

    // Store previous status for history
    const previousItemStatus = order.items[itemIndex].itemStatus || 'pending';

    // Update item status
    order.items[itemIndex].itemStatus = status;

    // Add tracking number if shipping
    if (status === "shipped" && trackingNumber) {
      order.items[itemIndex].trackingNumber = trackingNumber;
      order.items[itemIndex].shippedDate = new Date();
    }

    // Set delivered date if delivered
    if (status === "delivered") {
      order.items[itemIndex].deliveredDate = new Date();
    }

    // Update overall order status based on all items
    updateOverallOrderStatus(order);

    // Add to order's status history with better formatting
    order.statusHistory.push({
      status: order.status, // Current order status after update
      note: note || `Seller updated item from ${previousItemStatus} to ${status}`,
      itemId: itemId,
      previousItemStatus: previousItemStatus,
      newItemStatus: status,
      updatedBy: sellerId,
      timestamp: new Date()
    });

    await order.save();

    // Return updated order with populated fields
    const updatedOrder = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("items.product")
      .populate("items.seller", "name email");

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Server error while updating order status" });
  }
};

//helper function to calculate overall order status
function updateOverallOrderStatus(order) {
  const itemStatuses = order.items.map((item) => item.itemStatus || "pending");

  // Count different statuses
  const statusCounts = {
    pending: itemStatuses.filter(s => s === 'pending').length,
    processing: itemStatuses.filter(s => s === 'processing').length,
    shipped: itemStatuses.filter(s => s === 'shipped').length,
    delivered: itemStatuses.filter(s => s === 'delivered').length,
    cancelled: itemStatuses.filter(s => s === 'cancelled').length
  };

  const totalItems = itemStatuses.length;

  // All cancelled
  if (statusCounts.cancelled === totalItems) {
    order.status = 'cancelled';
  } 
  // All delivered
  else if (statusCounts.delivered === totalItems) {
    order.status = 'completed';
  } 
  // Some delivered, some cancelled, none pending/processing/shipped
  else if (statusCounts.delivered > 0 && statusCounts.cancelled > 0 && 
           statusCounts.pending === 0 && statusCounts.processing === 0 && statusCounts.shipped === 0) {
    order.status = 'partially_completed';
  }
  // At least one delivered (partial delivery)
  else if (statusCounts.delivered > 0) {
    order.status = 'partially_delivered';  // Add this status
  }
  // All shipped or mix of shipped/delivered
  else if (statusCounts.shipped + statusCounts.delivered === totalItems) {
    order.status = 'shipped';
  }
  // Any shipped
  else if (statusCounts.shipped > 0) {
    order.status = 'shipped';
  } 
  // Any processing
  else if (statusCounts.processing > 0) {
    order.status = 'processing';
  } 
  // All pending
  else {
    order.status = 'pending';
  }
}



module.exports = {
  createOrderFromCart,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  updateOrderStatus,
  getItemStatusHistory,

};
