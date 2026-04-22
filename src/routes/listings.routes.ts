// Import the Router factory function from the Express framework.
// This allows us to create modular, mountable route handlers that keep our application organized.
import { Router } from 'express';
// Import the strict controller functions responsible for listing business logic.
import { getAllListings, getListingById, createListing, updateListing, deleteListing } from '../controllers/listings.controller';

// Create an instance of an Express Router dedicated entirely to listings.
const router = Router();

// Map a GET request on the root path to the 'getAllListings' function.
// This will eventually become GET /listings when mounted in the main application.
router.get('/', getAllListings);

// Map a GET request with an dynamic ':id' parameter to the 'getListingById' function.
// This explicitly allows retrieving a single, specific listing via its ID.
router.get('/:id', getListingById);

// Map a POST request on the root path to 'createListing'.
// This endpoint expects a JSON payload and is used to add new listings to our array database.
router.post('/', createListing);

// Map a PUT request with an dynamic ':id' parameter to 'updateListing'.
// Used to cleanly modify the details of an existing listing based on the provided payload.
router.put('/:id', updateListing);

// Map a DELETE request with an dynamic ':id' parameter to 'deleteListing'.
// Used to securely remove a listing from our database based on the URL parameter.
router.delete('/:id', deleteListing);

// Export the router as the default export of this file.
// This makes it extremely easy to import and mount as a single unit inside index.ts.
export default router;
