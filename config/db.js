import mongoose from 'mongoose';

// Disable buffering globally so that database operations fail fast if MongoDB is not running
mongoose.set('bufferCommands', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30 seconds
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.warn('Proceeding without MongoDB. Database operations will be mocked/skipped.');
    }
};

export default connectDB;