// We define the exact shape a Listing MUST have.
export interface Listing {
  id: number;                                       // Auto-generated ID (required)
  title: string;                                    // Title of the property (required)
  description: string;                              // Description text (required)
  location: string;                                 // City/Country (required)
  pricePerNight: number;                            // Cost per night (required)
  guests: number;                                   // Max number of guests (required)
  type: "apartment" | "house" | "villa" | "cabin";  // Union Type: specific property types (required)
  amenities: string[];                              // Array of strings like ["WiFi", "Pool"] (required)
  rating?: number;                                  // Optional rating from 0-5
  host: string;                                     // Name of the host (required)
}

// We create an in-memory array holding 5 mock listings.
export const listings: Listing[] = [
  {
    id: 1,
    title: "Kigali City View Apartment",
    description: "Beautiful apartment in the heart of Kigali.",
    location: "Kigali, Rwanda",
    pricePerNight: 50,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Balcony", "Kitchen"],
    rating: 4.8,
    host: "Thierry"
  },
  {
    id: 2,
    title: "Lake Kivu Cabin",
    description: "Quiet cabin right on the water.",
    location: "Rubavu, Rwanda",
    pricePerNight: 85,
    guests: 4,
    type: "cabin",
    amenities: ["Lake Access", "Firepit"],
    host: "Bob"
  },
  {
    id: 3,
    title: "Luxury Nyarutarama Villa",
    description: "Massive villa with a pool.",
    location: "Kigali, Rwanda",
    pricePerNight: 300,
    guests: 10,
    type: "villa",
    amenities: ["Pool", "WiFi", "Chef"],
    rating: 5.0,
    host: "Thierry"
  },
  {
    id: 4,
    title: "Luxury Kiyovu Villa",
    description: "Massive villa with a big yard",
    location: "Kigali,Nyarugenge Rwanda",
    pricePerNight: 200,
    guests: 15,
    type: "villa",
    amenities: ["Pool", "WiFi", "Chef"],
    rating: 4.0,
    host: "Emmy"
  },
   {
    id: 5,
    title: "Rebero luxuries",
    description: "One of the beautiful house in kigali",
    location: "Kigali, Rwanda",
    pricePerNight: 200,
    guests: 15,
    type: "villa",
    amenities: ["Pool", "WiFi", "Chef"],
    rating: 4.0,
    host: "Emmy"
  }
];
