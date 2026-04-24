import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Extract the connection string from the .env file
const connectionString = `${process.env["DATABASE_URL"]}`;

// Set up the PostgreSQL connection pool
const pool = new Pool({ connectionString });

// Attach the pool to Prisma's PG Adapter
const adapter = new PrismaPg(pool);

// Instantiate the Prisma Client
const prisma = new PrismaClient({ adapter });

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