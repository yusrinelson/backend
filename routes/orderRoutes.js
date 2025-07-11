const express = require("express");
const router = express.Router();
const {
    createOrderFromCart,
    getUserOrders,
    getOrderById,
    getSellerOrders,
  updateOrderStatus

} = require("../controllers/orderController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

//Customer routes
router.post("/create", protect, createOrderFromCart);
router.get("/", protect, getUserOrders); 
router.get("/:orderId", protect, getOrderById); 

//Seller routes
router.get('/seller/orders',protect, restrictTo('seller'),getSellerOrders);
router.patch('/seller/:orderId/status',protect, restrictTo('seller'),updateOrderStatus); // Or keep the same route but expect itemId in body
// router.patch('/seller/:orderId/item/:itemId/status', protect, restrictTo('seller'), updateOrderStatus);
// router.get('/seller/stats', restrictTo('seller'),getSellerStats);



module.exports = router;