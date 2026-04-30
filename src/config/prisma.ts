import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Instantiate the Prisma Client
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env["DATABASE_URL"];
const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
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