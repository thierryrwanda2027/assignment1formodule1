// Import Express types Request and Response to strongly type our handler functions.
// This enables TypeScript to validate that we are interacting with Express correctly, eliminating the use of 'any'.
import { Request, Response } from 'express';
// Import the Listing interface and our 'listings' array acting as the database.
import { Listing, listings } from '../models/listing.model';
// Import the 'users' array so we can verify if a host exists when creating a listing.
import { users } from '../models/user.model';

// Export function to get all listings.
export const getAllListings = (req: Request, res: Response) => {
    // Respond with status 200 (OK) and send the entire listings array as JSON to the client.
    res.status(200).json(listings);
};

// Export function to get a specific listing by its ID.
export const getListingById = (req: Request, res: Response) => {
    // req.params.id grabs the dynamic ':id' variable from the URL path.
    const id = req.params.id;
    // Search the listings array for a listing whose id exactly matches the requested id.
    const listing = listings.find(l => l.id === id);

    // Guard Clause: If .find() returns undefined, the listing doesn't exist in our array.
    if (!listing) {
        // Return a 404 (Not Found) status to indicate the requested resource is missing.
        // The return statement immediately halts execution, preventing further code from running.
        return res.status(404).json({ error: "Listing not found" });
    }

    // If found, return the listing object back to the client with a 200 (OK) status.
    res.status(200).json(listing);
};

// Export function to create a new listing via a POST request.
export const createListing = (req: Request, res: Response) => {
    // Destructure the required fields from the parsed incoming JSON request body (req.body).
    const { title, description, price, hostId } = req.body;

    // Guard Clause: Check if any of the mandatory fields are missing or undefined.
    // Notice we use price === undefined because price could legitimately be 0.
    if (!title || !description || price === undefined || !hostId) {
        // Return 400 (Bad Request) if validation fails. The client needs to correct their payload.
        return res.status(400).json({ error: "Missing required fields: title, description, price, and hostId are required." });
    }

    // Extra Validation: Ensure that the 'price' is strictly a number to prevent runtime errors.
    if (typeof price !== 'number') {
        // Return 400 (Bad Request) if the price isn't numerical.
        return res.status(400).json({ error: "Price must be a number." });
    }

    // Business Logic: Check if the provided hostId actually corresponds to an existing user.
    const hostUser = users.find(u => u.id === hostId);
    
    // Guard Clause: If the user doesn't exist, they can't create a listing.
    if (!hostUser) {
        // Return 404 (Not Found) or 400 depending on interpretation; 400 makes sense for invalid relational data.
        return res.status(400).json({ error: "Invalid hostId: User does not exist." });
    }

    // Guard Clause: Ensure the user creating the listing actually has the proper authorization ("host" role).
    if (hostUser.role !== 'host') {
        // Return a 400 (Bad Request) because a "guest" is strictly forbidden from creating listings.
        return res.status(400).json({ error: "Only users with the 'host' role can create listings." });
    }

    // Construct the new listing object conforming exactly to our strict Listing interface.
    const newListing: Listing = {
        // Generate a random unique ID for the new listing (simple string generation).
        id: Math.random().toString(36).substring(2, 9),
        title, // Shorthand syntax equivalent to title: title
        description,
        price,
        hostId
    };

    // Add the newly constructed listing to our in-memory database array.
    listings.push(newListing);

    // Return status 201 (Created) which is the absolute standard RESTful response for resource creation.
    // Send the created object back to the client so they can use the newly generated ID.
    res.status(201).json(newListing);
};

// Export function to update an existing listing via a PUT request.
export const updateListing = (req: Request, res: Response) => {
    // Extract the target listing ID from the URL parameters.
    const id = req.params.id;
    // Extract potential update fields from the request body.
    const { title, description, price } = req.body;

    // Find the index of the target listing in the array to prepare for modification.
    const listingIndex = listings.findIndex(l => l.id === id);

    // Guard Clause: If the index is -1, the listing doesn't exist.
    if (listingIndex === -1) {
        // Send a 404 (Not Found) error response and exit the function.
        return res.status(404).json({ error: "Listing not found" });
    }

    // Get the existing listing object from the array using the found index.
    const existingListing = listings[listingIndex];

    // Construct the updated listing object by merging old and new data.
    const updatedListing: Listing = {
        // The ID and hostId should remain immutable, so we rigidly retain the existing ones.
        id: existingListing.id,
        hostId: existingListing.hostId,
        // For other fields, use the new value if provided, otherwise gracefully fallback to the existing value.
        title: title || existingListing.title,
        description: description || existingListing.description,
        // Handle price carefully to allow a price of 0 to be validly updated.
        price: price !== undefined ? price : existingListing.price
    };

    // Overwrite the old listing with the completely updated one in our database array.
    listings[listingIndex] = updatedListing;

    // Send a 200 (OK) status along with the newly updated listing back to the client.
    res.status(200).json(updatedListing);
};

// Export function to delete a listing via a DELETE request.
export const deleteListing = (req: Request, res: Response) => {
    // Grab the ID of the listing we wish to delete from the URL parameters.
    const id = req.params.id;
    // Find the exact position (index) of the listing to delete.
    const listingIndex = listings.findIndex(l => l.id === id);

    // Guard Clause: Ensure the listing actually exists before arbitrarily trying to delete it.
    if (listingIndex === -1) {
        // Return 404 (Not Found) if there is no such listing, stopping the function.
        return res.status(404).json({ error: "Listing not found" });
    }

    // Use the .splice() array method to safely remove exactly 1 element at the specified index.
    listings.splice(listingIndex, 1);

    // Return a 200 (OK) status with a simple success message indicating the deletion worked.
    res.status(200).json({ message: "Listing deleted successfully" });
};
