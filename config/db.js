const mongoose = require('mongoose');

//connect to db

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        mongoose.connection.useDb('userAuth');
        console.log('connected to db');
    } catch(err){
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = connectDB