// Export the User interface so it can be used in other files.
// This interface defines the strict structure that a user object must follow,
// ensuring there is no use of 'any' and keeping our application type-safe.
export interface User {
    // The unique identifier for the user, represented as a string.
    id: string;
    // The user's name, represented as a string.
    name: string;
    // The user's email address, represented as a string.
    email: string;
    // The role must be exactly either "host" or "guest". 
    // This is a strict union type that prevents any other string from being used, enforcing strict data integrity.
    role: "host" | "guest";
}

// Create an exported array to serve as our in-memory database for users.
// By typing it strictly as 'User[]', TypeScript guarantees we can only store valid User objects inside it.
export const users: User[] = [];
