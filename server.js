require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db.js') ;
const cors = require('cors');

//route files
const userRoutes = require('./routes/authRoutes.js');
const productRoutes = require('./routes/productRoutes.js');
// const orderRoutes = require('./routes/orderRoutes.js');
// const cartRoutes = require('./routes/cartRoutes.js');
const cartRoutes = require('./routes/cartRoutes.js')

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

//middleware to parse json bodies
app.use(express.json());
app.use(express.urlencoded({extended: true}));


//routes
app.use('/api/auth', userRoutes)
app.use('/api/products', productRoutes)
// app.use('/api/orders', orderRoutes)
// app.use('/api/cart', cartRoutes)
app.use('/api/cart', cartRoutes)


// connect to mongoDB

connectDB(app.listen(process.env.PORT, () => {
    console.log('server is running on port')
}));

