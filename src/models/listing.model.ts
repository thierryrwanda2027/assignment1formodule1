// Export the Listing interface to strictly define the properties of a property listing.
// This ensures consistency across the application whenever we deal with listings, avoiding 'any' types.
export interface Listing {
    // The unique identifier for the listing (string).
    id: string;
    // The title of the listing, e.g., "Cozy Cabin in the Woods" (string).
    title: string;
    // A description of the property (string).
    description: string;
    // The price per night, represented as a number.
    price: number;
    // The ID of the user (who must be a "host") that owns this listing (string).
    hostId: string;
}

// Create an exported array to serve as our in-memory database for listings.
// Explicitly typing it as 'Listing[]' guarantees that only properly structured listing objects are stored.
export const listings: Listing[] = [];
