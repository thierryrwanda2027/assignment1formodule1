// Import the Router factory function from the Express framework.
// A Router acts like a "mini-application", allowing us to group related routes together modularly.
import { Router } from 'express';
// Import all the controller functions we explicitly built for user operations.
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/users.controller';

// Initialize a new Router instance that will manage all user-related endpoints.
const router = Router();

// Define a GET route at the root path ('/').
// When a client makes a GET request to /users (since this router will be mounted at /users in index.ts),
// Express will automatically execute the 'getAllUsers' controller function.
router.get('/', getAllUsers);

// Define a GET route with a dynamic parameter ':id'.
// The colon indicates that 'id' is a dynamic variable. If a client requests /users/123,
// Express captures '123' and places it inside 'req.params.id', then calls 'getUserById'.
router.get('/:id', getUserById);

// Define a POST route at the root path ('/').
// This route is strictly used when clients want to submit new JSON payload data to create a user.
// It maps directly to the 'createUser' controller function.
router.post('/', createUser);

// Define a PUT route with the dynamic ':id' parameter.
// PUT requests are conventionally used in REST APIs to fully update an existing resource.
// Express will call 'updateUser' when this endpoint is successfully hit.
router.put('/:id', updateUser);

// Define a DELETE route with the dynamic ':id' parameter.
// This route actively listens for HTTP DELETE requests and triggers the 'deleteUser' function,
// removing the targeted resource from our database.
router.delete('/:id', deleteUser);

// Export the configured router as the default export.
// This allows it to be imported elegantly as a single modular unit in our main index.ts file.
export default router;
