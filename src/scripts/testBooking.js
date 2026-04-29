const baseUrl = 'http://localhost:3000';
const email = 'niyonkuruthierry37+test@gmail.com';
const password = '@Thierry2050';
const listingId = '146db380-3f76-4424-ad63-50a1355372b4';

async function testBooking() {
  console.log('--- Phase 1: Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token } = await loginRes.json();

  console.log('\n--- Phase 2: Create Booking ---');
  const bookingRes = await fetch(`${baseUrl}/bookings`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      listingId,
      checkIn: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      checkOut: new Date(Date.now() + 86400000 * 3).toISOString() // in 3 days
    })
  });
  const bookingData = await bookingRes.json();
  console.log('Booking Result:', bookingData.id ? 'SUCCESS' : 'FAILED');
  console.log('Booking Body:', bookingData);
}

testBooking().catch(console.error);
