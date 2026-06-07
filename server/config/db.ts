import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
    console.log(`\x1b[32m%s\x1b[0m`, `DATABASE CONNECTED SUCCESSFULLY!`);
    console.log(`\x1b[33m%s\x1b[0m`, `MongoDB Host: ${conn.connection.host}`);
    console.log(`\x1b[35m%s\x1b[0m`, `DB Name: ${conn.connection.name}`);
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
  } catch (error) {
    const err = error as Error;
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
