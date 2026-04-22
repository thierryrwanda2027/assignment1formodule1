// Import the Request and Response types from the 'express' package.
// We use these to explicitly type the 'req' and 'res' parameters in our handler functions, avoiding 'any'.
import { Request, Response } from 'express';
// Import the User interface for type-checking and the 'users' array which acts as our database.
import { User, users } from '../models/user.model';

// Export a function to handle GET requests for retrieving all users.
export const getAllUsers = (req: Request, res: Response) => {
    // res.status(200) sets the HTTP status code to 200 (OK), indicating the request was successful.
    // .json(users) sends the entire 'users' array back to the client in JSON format.
    res.status(200).json(users);
};

// Export a function to handle GET requests for retrieving a single user by their ID.
export const getUserById = (req: Request, res: Response) => {
    // req.params contains route parameters. We extract the 'id' parameter from the URL.
    const id = req.params.id;
    // Use the array .find() method to search our database for a user with the matching ID.
    const user = users.find(u => u.id === id);

    // Guard Clause: If the user is not found (undefined), we must return an error.
    if (!user) {
        // res.status(404) sets the HTTP status code to 404 (Not Found).
        // .json() sends an error message explaining why the request failed.
        // The 'return' statement is crucial here; it stops further execution of the function.
        return res.status(404).json({ error: "User not found" });
    }

    // If the user is found, send a 200 (OK) status along with the user object.
    res.status(200).json(user);
};

// Export a function to handle POST requests for creating a new user.
export const createUser = (req: Request, res: Response) => {
    // req.body contains the parsed JSON data sent by the client. We destructure the expected fields.
    const { name, email, role } = req.body;

    // Guard Clause: Check if any required fields are missing in the request body.
    if (!name || !email || !role) {
        // res.status(400) sets the status to 400 (Bad Request), meaning the client sent invalid data.
        // We return an error message to guide the client on what went wrong.
        return res.status(400).json({ error: "Missing required fields: name, email, and role are required." });
    }

    // Guard Clause: Ensure the role is exactly one of the allowed literal types ("host" or "guest").
    if (role !== "host" && role !== "guest") {
        // Return a 400 status because the provided role violates our strict union type.
        return res.status(400).json({ error: "Invalid role. Must be 'host' or 'guest'." });
    }

    // Create a new User object that perfectly matches the User interface.
    const newUser: User = {
        // Generate a simple random string to serve as a unique ID for the user.
        id: Math.random().toString(36).substring(2, 9),
        // Assign the name from the request body.
        name: name,
        // Assign the email from the request body.
        email: email,
        // Assign the role from the request body. We assert the type to reassure TypeScript,
        // though our guard clause above mathematically proved it is one of these two values.
        role: role as "host" | "guest"
    };

    // Push the new user object into our in-memory 'users' array, saving it to our "database".
    users.push(newUser);

    // res.status(201) sets the status to 201 (Created), which is the standard RESTful response for a successful POST.
    // .json() returns the newly created user object to the client so they have access to the generated ID.
    res.status(201).json(newUser);
};

// Export a function to handle PUT requests for updating an existing user.
export const updateUser = (req: Request, res: Response) => {
    // Extract the ID of the user we want to update from the URL parameters.
    const id = req.params.id;
    // Extract the fields that might be updated from the incoming request body.
    const { name, email, role } = req.body;

    // Find the index of the user in our array. .findIndex() returns -1 if no match is found.
    const userIndex = users.findIndex(u => u.id === id);

    // Guard Clause: If userIndex is -1, the user does not exist in our database.
    if (userIndex === -1) {
        // Return a 404 (Not Found) status because we can't update a non-existent resource.
        return res.status(404).json({ error: "User not found" });
    }

    // Optional Guard Clause: If the client is trying to update the role, ensure it's a valid role.
    if (role && role !== "host" && role !== "guest") {
        // Return 400 Bad Request if the new role is invalid.
        return res.status(400).json({ error: "Invalid role. Must be 'host' or 'guest'." });
    }

    // Retrieve the existing user object from the array using the found index.
    const existingUser = users[userIndex];

    // Create a new updated user object. We merge the existing user data with the new data.
    const updatedUser: User = {
        // Keep the original ID intact; IDs should be immutable.
        id: existingUser.id,
        // Update name if provided in req.body, otherwise keep the old name.
        name: name || existingUser.name,
        // Update email if provided, otherwise keep the old email.
        email: email || existingUser.email,
        // Update role if provided, otherwise keep the old role.
        role: role || existingUser.role
    };

    // Replace the old user object in the database array with the newly updated user object.
    users[userIndex] = updatedUser;

    // Send a 200 (OK) status back to the client along with the updated user data.
    res.status(200).json(updatedUser);
};

// Export a function to handle DELETE requests for removing a user.
export const deleteUser = (req: Request, res: Response) => {
    // Extract the ID from the route parameters (the URL).
    const id = req.params.id;
    // Find the index of the user we want to delete.
    const userIndex = users.findIndex(u => u.id === id);

    // Guard Clause: If the user is not found, we cannot delete them.
    if (userIndex === -1) {
        // Return a 404 (Not Found) error, preventing the application from crashing or deleting the wrong item.
        return res.status(404).json({ error: "User not found" });
    }

    // Use the array .splice() method to remove exactly 1 element starting at the userIndex.
    // This effectively deletes the user from our in-memory database.
    users.splice(userIndex, 1);

    // Send a 200 (OK) status to confirm successful deletion. 
    // We send a simple success message in the JSON payload.
    res.status(200).json({ message: "User deleted successfully" });
};
