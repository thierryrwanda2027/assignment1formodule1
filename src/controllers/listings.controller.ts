// Import Express types Request and Response to strongly type our handler functions.
// This enables TypeScript to validate that we are interacting with Express correctly, eliminating the use of 'any'.
import { Request, Response } from 'express';
// Import the updated Listing interface and our 'listings' array acting as the database.
import { Listing, listings } from '../models/listing.model';

// Export function to get all listings.
export const getAllListings = (req: Request, res: Response) => {
    // Respond with status 200 (OK) and send the entire listings array as JSON to the client.
    res.status(200).json(listings);
};

// Export function to get a specific listing by its ID.
export const getListingById = (req: Request, res: Response) => {
    // req.params.id grabs the dynamic ':id' variable from the URL path as a string.
    // Since our new Listing model uses numbers for IDs, we must explicitly convert it using Number().
    const id = Number(req.params.id);

    // Guard Clause: Validate that the ID is actually a valid number
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format. ID must be a number." });
    }

    // Search the listings array for a listing whose id exactly matches the requested numeric id.
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
    // Destructure all the required fields from the parsed incoming JSON request body (req.body).
    const { title, description, location, pricePerNight, guests, type, amenities, host, rating } = req.body;

    // Guard Clause: Check if any of the mandatory fields are missing.
    if (!title || !description || !location || pricePerNight === undefined || guests === undefined || !type || !amenities || !host) {
        // Return 400 (Bad Request) if validation fails. The client needs to correct their payload.
        return res.status(400).json({ error: "Missing required fields. title, description, location, pricePerNight, guests, type, amenities, and host are required." });
    }

    // Extra Validation: Ensure the union type matches exactly what is expected
    if (type !== "apartment" && type !== "house" && type !== "villa" && type !== "cabin") {
        return res.status(400).json({ error: "Invalid type. Must be apartment, house, villa, or cabin." });
    }

    // Extra Validation: Ensure amenities is an array to strictly follow the string[] type
    if (!Array.isArray(amenities)) {
        return res.status(400).json({ error: "Amenities must be an array of strings." });
    }

    // Determine the next ID by finding the maximum existing ID and adding 1.
    // If the array is empty, default to 1.
    const nextId = listings.length > 0 ? Math.max(...listings.map(l => l.id)) + 1 : 1;

    // Construct the new listing object conforming exactly to our strict Listing interface.
    const newListing: Listing = {
        id: nextId,
        title,
        description,
        location,
        pricePerNight: Number(pricePerNight), // Enforce number type
        guests: Number(guests),               // Enforce number type
        type: type as "apartment" | "house" | "villa" | "cabin",
        amenities,
        host,
        rating: rating !== undefined ? Number(rating) : undefined // Assign rating if provided
    };

    // Add the newly constructed listing to our in-memory database array.
    listings.push(newListing);

    // Return status 201 (Created) which is the absolute standard RESTful response for resource creation.
    // Send the created object back to the client so they can use the newly generated ID.
    res.status(201).json(newListing);
};

// Export function to update an existing listing via a PUT request.
export const updateListing = (req: Request, res: Response) => {
    // Extract and convert the target listing ID from the URL parameters to a number.
    const id = Number(req.params.id);

    // Guard Clause: Validate ID format
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format. ID must be a number." });
    }

    // Extract potential update fields from the request body.
    const { title, description, location, pricePerNight, guests, type, amenities, host, rating } = req.body;

    // Find the index of the target listing in the array to prepare for modification.
    const listingIndex = listings.findIndex(l => l.id === id);

    // Guard Clause: If the index is -1, the listing doesn't exist.
    if (listingIndex === -1) {
        // Send a 404 (Not Found) error response and exit the function.
        return res.status(404).json({ error: "Listing not found" });
    }

    // Validate type if provided
    if (type && type !== "apartment" && type !== "house" && type !== "villa" && type !== "cabin") {
        return res.status(400).json({ error: "Invalid type. Must be apartment, house, villa, or cabin." });
    }

    // Get the existing listing object from the array using the found index.
    const existingListing = listings[listingIndex];

    // Construct the updated listing object by merging old and new data.
    const updatedListing: Listing = {
        // ID remains completely immutable
        id: existingListing.id,
        // For all other fields, use the newly provided value or gently fallback to the existing state.
        title: title || existingListing.title,
        description: description || existingListing.description,
        location: location || existingListing.location,
        pricePerNight: pricePerNight !== undefined ? Number(pricePerNight) : existingListing.pricePerNight,
        guests: guests !== undefined ? Number(guests) : existingListing.guests,
        type: type ? (type as "apartment" | "house" | "villa" | "cabin") : existingListing.type,
        amenities: Array.isArray(amenities) ? amenities : existingListing.amenities,
        host: host || existingListing.host,
        rating: rating !== undefined ? Number(rating) : existingListing.rating
    };

    // Overwrite the old listing with the completely updated one in our database array.
    listings[listingIndex] = updatedListing;

    // Send a 200 (OK) status along with the newly updated listing back to the client.
    res.status(200).json(updatedListing);
};

// Export function to delete a listing via a DELETE request.
export const deleteListing = (req: Request, res: Response) => {
    // Extract and explicitly convert the ID from the URL string parameters to a Number.
    const id = Number(req.params.id);

    // Guard Clause: Ensure ID is a valid number
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format. ID must be a number." });
    }

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
