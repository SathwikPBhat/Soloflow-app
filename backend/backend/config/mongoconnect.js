const mongoose = require('mongoose');
require('dotenv').config(); 
const connectmongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CLOUD);
    console.log('MongoDB connection successful');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error; 
  }
};

module.exports = connectmongo;