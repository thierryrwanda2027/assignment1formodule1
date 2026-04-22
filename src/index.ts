// Import the default express function from the 'express' package.
// This is the core framework function used to instantiate and build our entire web server.
import express, { Request, Response } from 'express';
// Import the modular routes we meticulously defined for users.
import userRoutes from './routes/users.routes';
// Import the modular routes we meticulously defined for listings.
import listingRoutes from './routes/listings.routes';

// Initialize the Express application by executing the express() function.
// 'app' is the main object representing our entire REST API.
const app = express();
// Define the port number our server will actively listen on. 
// We use process.env.PORT so hosting platforms like Render can dynamically assign a port.
// If process.env.PORT is not set (like in local development), it falls back to 3000.
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE CONFIGURATION
// ==========================================

// app.use() mounts middleware functions. Middleware intercepts incoming HTTP requests
// right before they reach our specific route handlers.
// express.json() is a built-in middleware that strictly parses incoming request bodies 
// formatted as JSON. If we do not include this, 'req.body' will evaluate to undefined in our POST/PUT routes!
app.use(express.json());

// ==========================================
// ROUTE MOUNTING
// ==========================================

// We use app.use() to thoughtfully mount our modular routers at specific base URL paths.
// Any incoming HTTP request starting with '/users' is automatically delegated to the 'userRoutes' router.
// For example, a request to POST /users will be handled cleanly by the POST '/' route inside userRoutes.ts.
app.use('/users', userRoutes);

// Any incoming HTTP request starting with '/listings' is delegated to the 'listingRoutes' router.
// This maintains a strict, highly organized MVC file structure.
app.use('/listings', listingRoutes);

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

// ==========================================
// SERVER INITIALIZATION
// ==========================================

// app.listen() boots up the server and instructs it to continuously listen for incoming HTTP requests
// on the previously specified PORT (3000).
app.listen(PORT, () => {
    // Once the server has successfully started and bound to the port, this callback function triggers,
    // logging a helpful, readable message to the console so the developer knows it's working.
    console.log(`Server is running smoothly on http://localhost:${PORT}`);
});
