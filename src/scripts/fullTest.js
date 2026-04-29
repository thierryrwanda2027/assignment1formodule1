const fs = require('fs');
const path = require('path');

async function testAll() {
  const baseUrl = 'http://localhost:3000';
  const email = 'niyonkuruthierry37+test@gmail.com';
  const password = '@Thierry2050';
  const imagePath = 'C:/Users/theni/.gemini/antigravity/brain/00eb0e70-9359-4eaf-bc27-41235cf76211/test_avatar_1777366150292.png';

  console.log('--- Phase 1: Login ---');
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token, user } = await loginRes.json();
  console.log('Logged in, User ID:', user.id);

  console.log('\n--- Phase 2: Upload Avatar ---');
  const formData = new FormData();
  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  formData.append('image', blob, 'avatar.png');

  const uploadRes = await fetch(`${baseUrl}/users/${user.id}/avatar`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) {
    console.error('Upload Failed Body:', uploadData);
  }
  console.log('Upload Status:', uploadRes.status);
  console.log('Upload Result:', uploadData.avatar ? 'SUCCESS (URL found)' : 'FAILED');
  console.log('Avatar URL:', uploadData.avatar);

  console.log('\n--- Phase 3: Delete Avatar ---');
  const deleteRes = await fetch(`${baseUrl}/users/${user.id}/avatar`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Result:', deleteData.message || deleteData.error);

  console.log('\n--- ALL TESTS COMPLETED ---');
}

testAll().catch(console.error);
