// Import the default express function from the 'express' package.
// This is the core framework function used to instantiate and build our entire web server.
import "dotenv/config";
import express, { Request, Response } from 'express';
import userRoutes from './routes/users.routes';
import listingRoutes from './routes/listings.routes';
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/bookings.routes';
import uploadRoutes from './routes/upload.routes';
import reviewRoutes from './routes/reviews.routes';
import { setupSwagger } from "./config/swagger";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/error.middleware";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Initialize Swagger Docs
setupSwagger(app);

// ROUTE MOUNTING
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/listings', listingRoutes);
app.use('/bookings', bookingRoutes);
app.use('/reviews', reviewRoutes);
app.use('/', uploadRoutes); // Mounts /users/:id/avatar and /listings/:id/photos


// ==========================================
// 404 CATCH-ALL ROUTE (CRITICAL REQUIREMENT)
// ==========================================

// This is a "catch-all" middleware purposefully placed at the very bottom of our route definitions.
// Express evaluates routes sequentially in the exact order they are defined. If a client request doesn't match
// any of the explicitly defined routes above (e.g., GET /api/unknown-endpoint), it will eventually trickle down and hit this block.
app.use((req: Request, res: Response) => {
    // We send a 404 (Not Found) status code to definitively inform the client that the requested
    // endpoint simply does not exist on our server.
    res.status(404).json({ error: "Endpoint not found" });
});

// GLOBAL ERROR HANDLER
app.use(errorHandler);

// ==========================================
// SERVER INITIALIZATION
// ==========================================

// app.listen() boots up the server and instructs it to continuously listen for incoming HTTP requests
// on the previously specified PORT (3000).
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        // Once the server has successfully started and bound to the port, this callback function triggers,
        // logging a helpful, readable message to the console so the developer knows it's working.
        console.log(`Server is running smoothly on http://localhost:${PORT}`);
    });
}

export default app;
