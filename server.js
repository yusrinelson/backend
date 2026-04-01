require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db.js');
const cors = require('cors');

// route files
const userRoutes = require('./routes/authRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
const cartRoutes = require('./routes/cartRoutes.js');
const orderRoutes = require('./routes/orderRoutes.js');
const wishlistRoutes = require('./routes/wishlistRoutes.js');

const app = express();

// CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://mobicart-frontend.vercel.app',
  ],
  credentials: true
}));

// middleware to parse json bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use('/api/auth', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);

// connect to mongoDB then start server
const PORT = process.env.PORT || 4000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});