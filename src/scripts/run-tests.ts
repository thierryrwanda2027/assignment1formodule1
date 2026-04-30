import "dotenv/config";

const API_URL = process.env.API_URL || "http://localhost:3000";

async function runTests() {
  console.log("========================================");
  console.log("🚀 Starting Lesson 6 Performance Tests 🚀");
  console.log("========================================");

  // 1. Search & Filtering
  console.log("\n--- Testing Search & Filtering ---");
  let res = await fetch(`${API_URL}/listings?location=NYC`);
  console.log(`[GET /listings?location=NYC] Status: ${res.status}`);

  res = await fetch(`${API_URL}/listings?minPrice=50&maxPrice=150`);
  console.log(`[GET /listings?minPrice=50&maxPrice=150] Status: ${res.status}`);

  res = await fetch(`${API_URL}/listings?type=apartment&guests=2`);
  console.log(`[GET /listings?type=apartment&guests=2] Status: ${res.status}`);

  res = await fetch(`${API_URL}/listings?page=2&limit=5`);
  let data: any = await res.json();
  console.log(`[GET /listings?page=2&limit=5] Status: ${res.status}, Total Pages: ${data?.meta?.totalPages || 'N/A'}`);

  // 2. Stats & Caching
  console.log("\n--- Testing Stats & Caching ---");
  const t1 = Date.now();
  res = await fetch(`${API_URL}/listings/stats`);
  const t2 = Date.now();
  console.log(`[GET /listings/stats] (1st call) Status: ${res.status}, Time: ${t2 - t1}ms`);
  
  const t3 = Date.now();
  res = await fetch(`${API_URL}/listings/stats`);
  const t4 = Date.now();
  console.log(`[GET /listings/stats] (2nd call - cached) Status: ${res.status}, Time: ${t4 - t3}ms`);

  res = await fetch(`${API_URL}/users/stats`);
  console.log(`[GET /users/stats] Status: ${res.status}`);

  // 3. Compression
  console.log("\n--- Testing Compression ---");
  res = await fetch(`${API_URL}/listings`, { headers: { 'Accept-Encoding': 'gzip' } });
  console.log(`[GET /listings] Compression Header (Content-Encoding): ${res.headers.get('content-encoding') || 'none'}`);

  // 4. Rate Limiting
  console.log("\n--- Testing Rate Limiting ---");
  console.log("Sending 25 POST requests to a route to trigger strict limiter...");
  let rateLimited = false;
  for (let i = 0; i < 25; i++) {
    const r = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", password: "password" })
    });
    if (r.status === 429) {
      rateLimited = true;
      console.log(`[POST /auth/login] Request ${i + 1} hit rate limit (429)!`);
      break;
    }
  }
  if (!rateLimited) console.log("Did not hit rate limit (maybe limiter not applied or threshold not reached).");

  console.log("\n✅ All automated tests completed!");
}

runTests().catch(console.error);
