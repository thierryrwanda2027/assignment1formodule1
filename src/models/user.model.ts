// We define the exact shape a User MUST have.
export interface User {
    id: number;                 // Auto-generated ID (required)
    name: string;               // Full name (required)
    email: string;              // Email address (required)
    username: string;           // Login name (required)
    phone: string;              // Phone number (required)
    role: "host" | "guest";     // Union Type: Must be exactly "host" or "guest" (required)
    avatar?: string;            // The '?' means this is optional. Can be missing.
    bio?: string;               // The '?' means this is optional. Can be missing.
}

// We create an in-memory array (our fake database) holding 3 mock users.
// We use ': User[]' to tell TypeScript this array can ONLY hold objects that match the User interface.
export const users: User[] = [
    {
        id: 1,
        name: "Bila",
        email: "bila@gmail.com.com",
        username: "bila404",
        phone: "07883729173",
        role: "host",
        bio: "Software Engineer from Kigali"
    },
    {
        id: 2,
        name: "Alice",
        email: "alice@yahoo.com",
        username: "alice_travels",
        phone: "0792364791",
        role: "guest"
    },
    {
        id: 3,
        name: "Bob",
        email: "bob@microsoft.com",
        username: "bob_builder",
        phone: "0787263718",
        role: "host",
        avatar: "https://example.com/bob.jpg"
    }
];