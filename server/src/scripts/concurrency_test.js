const API_BASE = 'http://localhost:5000/api';

async function testConcurrency() {
  console.log('--- DigiQueue High-Concurrency Race Condition Verification ---');

  // 1. Admin login to reset session
  const adminLogin = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@digiqueue.local',
      password: 'AdminPassword123!',
    }),
  }).then((r) => r.json());

  const docs = await fetch(`${API_BASE}/admin/doctors`, {
    headers: { Authorization: `Bearer ${adminLogin.token}` },
  }).then((r) => r.json());
  const doctor = docs.data[0];

  // Reset to pristine session
  await fetch(`${API_BASE}/doctors/${doctor.id}/reset-session`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminLogin.token}` },
  }).then((r) => r.json());

  console.log(`Pristine session ready for doctor ${doctor.name}.`);
  console.log('Firing 10 concurrent check-in requests simultaneously in parallel...');

  const concurrentRequests = Array.from({ length: 10 }, (_, i) => {
    return fetch(`${API_BASE}/tokens/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: doctor.id,
        patientName: `Concurrent Child ${i + 1}`,
        guardianName: `Guardian ${i + 1}`,
        guardianPhone: `555-01${(i + 10).toString()}`,
      }),
    }).then((r) => r.json());
  });

  const results = await Promise.all(concurrentRequests);

  const issuedTokens = results.map((r) => r.data?.token?.tokenNumber).filter(Boolean);
  issuedTokens.sort((a, b) => a - b);

  console.log('Issued Token Numbers:', issuedTokens);

  const isUnique = new Set(issuedTokens).size === issuedTokens.length;
  const isCompleteSequence = issuedTokens.every((val, idx) => val === idx + 1);

  if (isUnique && isCompleteSequence && issuedTokens.length === 10) {
    console.log('✅ PERFECT CONCURRENCY: Exactly 10 unique tokens issued numbered #1 through #10 with 0 collisions!');
  } else {
    console.error('❌ Concurrency test failed:', { issuedTokens, isUnique, isCompleteSequence });
    process.exit(1);
  }
}

testConcurrency().catch((err) => {
  console.error(err);
  process.exit(1);
});
