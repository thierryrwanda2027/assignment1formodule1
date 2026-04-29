const baseUrl = 'http://localhost:3000';
const email = 'niyonkuruthierry37+test@gmail.com';
const password = '@Thierry2050';
const bookingId = '616d03a8-3689-46c9-a5f3-4dfdc594135e';

async function testCancellation() {
  console.log('--- Phase 1: Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token } = await loginRes.json();

  console.log('\n--- Phase 2: Cancel Booking ---');
  const cancelRes = await fetch(`${baseUrl}/bookings/${bookingId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const cancelData = await cancelRes.json();
  console.log('Cancel Result:', cancelData.message || cancelData.error);
}

testCancellation().catch(console.error);
