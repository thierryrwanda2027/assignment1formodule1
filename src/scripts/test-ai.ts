// Using global fetch (Node 18+)


async function run() {
  console.log("Testing Smart Search...");
  const res = await fetch("http://localhost:3000/api/v1/ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "I want an apartment under $200" })
  });
  const data = await res.json();
  console.log(data.filters);
}

run().catch(console.error);
