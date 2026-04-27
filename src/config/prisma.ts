import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Instantiate the Prisma Client
const prisma = new PrismaClient();

// Define the connection function
export const connectDB = async () => {
    try {
        // Attempt to connect to Postgres
        await prisma.$connect();
        console.log("Database connected successfully.");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1); // Kill the entire application if the DB is unreachable
    }
};

// Export prisma as the default tool for your controllers to use
export default prisma;