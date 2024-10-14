const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.NODE_ENV === "localhost"
        ? "mongodb://localhost:27017/localhost" // Placeholder for test DB (this will be overridden by MongoMemoryServer in your tests)
        : process.env.MONGODB_URI; // Use MongoDB Atlas in development/production

    const conn = await mongoose.connect(mongoURI, {});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the error if the connection fails
    console.error("Could not connect to MongoDB...", error);
    process.exit(1);
  }
};

module.exports = connectDB;
