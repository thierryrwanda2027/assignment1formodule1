// Import the default express function from the 'express' package.
// This is the core framework function used to instantiate and build our entire web server.
import "dotenv/config";
import express, { Request, Response } from 'express';
import { setupSwagger } from "./config/swagger";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/error.middleware";
import compression from "compression";
import { generalLimiter } from "./middlewares/rateLimiter";
import v1Router from "./routes/v1";
import { deprecateV1 } from "./middlewares/deprecation.middleware";
import morgan from "morgan";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "http://localhost:3000", process.env.API_URL || ""],
    },
  },
}));
app.use(compression());
app.use(generalLimiter);
app.use(process.env.NODE_ENV === "production" ? morgan("combined") : morgan("dev"));

// HEALTH CHECK ENDPOINT
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

// Redirect root to API docs
app.get("/", (req, res) => res.redirect("/api-docs"));

// Initialize Swagger Docs
setupSwagger(app);

// ROUTE MOUNTING (VERSIONED)
app.use('/api/v1', deprecateV1, v1Router);

// REDIRECT UNVERSIONED ROUTES TO V1
app.use('/listings', (req, res) => res.redirect(301, `/api/v1/listings${req.url}`));
app.use('/users', (req, res) => res.redirect(301, `/api/v1/users${req.url}`));
app.use('/bookings', (req, res) => res.redirect(301, `/api/v1/bookings${req.url}`));
app.use('/reviews', (req, res) => res.redirect(301, `/api/v1/reviews${req.url}`));
app.use('/auth', (req, res) => res.redirect(301, `/api/v1/auth${req.url}`));


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
