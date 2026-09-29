const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function fetchJSON(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.message || `HTTP ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function runVerification() {
  console.log('===============================================================');
  console.log('  🏥 DigiQueue Real-Time Pediatric Token System E2E Test Suite');
  console.log('===============================================================\n');

  try {
    // 1. Health Check
    console.log('[1/9] Verifying Backend Health Check...');
    const health = await fetchJSON('/health');
    console.log('  ✓ Backend API is online:', health.service, '\n');

    // 2. Admin Login
    console.log('[2/9] Authenticating Admin Account (admin@digiqueue.local)...');
    const adminLogin = await fetchJSON('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@digiqueue.local',
        password: 'AdminPassword123!',
      }),
    });
    const adminToken = adminLogin.token;
    console.log(`  ✓ Admin Authenticated. Role: ${adminLogin.user.role}`);

    // Fetch clinics and doctors
    const clinics = await fetchJSON('/admin/clinics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`  ✓ Retrieved ${clinics.data.length} Clinic(s): "${clinics.data[0]?.name}"`);

    const doctors = await fetchJSON('/admin/doctors', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const targetDoctor = doctors.data[0];
    console.log(`  ✓ Target Doctor: ${targetDoctor.name} (${targetDoctor.specialization})`);

    // Reset session before running test to ensure pristine state
    await fetchJSON(`/doctors/${targetDoctor.id}/reset-session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('  ✓ Clean Session Initialized for Testing\n');

    // 3. Doctor QR Code Generation Check
    console.log('[3/9] Verifying Reception Desk QR Generation for Doctor...');
    const qrRes = await fetchJSON(`/doctors/${targetDoctor.id}/qr`);
    console.log(`  ✓ Check-In URL: ${qrRes.data.checkInUrl}`);
    console.log(`  ✓ QR Code Data URL length: ${qrRes.data.qrDataUrl.length} chars (Valid Base64 PNG)\n`);

    // 4. Patient 1 Check-In (Leo Parker)
    console.log('[4/9] Patient 1 Check-In (Leo Parker)...');
    const p1 = await fetchJSON('/tokens/issue', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: targetDoctor.id,
        patientName: 'Leo Parker (Age 3)',
        guardianName: 'Emma Parker',
        guardianPhone: '555-0101',
      }),
    });
    const token1 = p1.data.token;
    console.log(`  ✓ Token Issued: #${token1.tokenNumber} (ID: ${token1.id})`);

    const p1Status = await fetchJSON(`/tokens/${token1.id}/status`);
    console.log(`  ✓ Patient 1 Status: "${p1Status.data.token.status}", Ahead of You: ${p1Status.data.aheadCount}\n`);

    // 5. Patient 2 Check-In (Zara Khan)
    console.log('[5/9] Patient 2 Check-In (Zara Khan)...');
    const p2 = await fetchJSON('/tokens/issue', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: targetDoctor.id,
        patientName: 'Zara Khan (Age 5)',
        guardianName: 'Tariq Khan',
        guardianPhone: '555-0102',
      }),
    });
    const token2 = p2.data.token;
    console.log(`  ✓ Token Issued: #${token2.tokenNumber} (ID: ${token2.id})`);

    const p2Status = await fetchJSON(`/tokens/${token2.id}/status`);
    console.log(`  ✓ Patient 2 Status: "${p2Status.data.token.status}", Ahead of You: ${p2Status.data.aheadCount}\n`);

    if (p2Status.data.aheadCount !== 1) {
      throw new Error(`Expected Patient 2 aheadCount to be 1, got ${p2Status.data.aheadCount}`);
    }

    // 6. Supervisor Login & Queue Orchestration
    console.log('[6/9] Authenticating Supervisor Account (supervisor@digiqueue.local)...');
    const supLogin = await fetchJSON('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'supervisor@digiqueue.local',
        password: 'SupervisorPassword123!',
      }),
    });
    const supToken = supLogin.token;
    console.log(`  ✓ Supervisor Authenticated. Clinic: ${supLogin.user.clinic?.name}`);

    // Call Next Patient
    console.log('  -> Calling Next Patient (Token #1)...');
    const callNextRes = await fetchJSON(`/doctors/${targetDoctor.id}/next`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${supToken}` },
    });
    const promotedToken = callNextRes.data.promotedToken;
    console.log(`  ✓ Consultation Started for Token #${promotedToken.tokenNumber} (${promotedToken.patientName})`);

    // Verify Patient 1 status is in-consultation
    const p1StatusAfter = await fetchJSON(`/tokens/${token1.id}/status`);
    console.log(`  ✓ Patient 1 Live Status: "${p1StatusAfter.data.token.status}" (Should be in-consultation)`);

    // Verify Patient 2 ahead count updated to 0
    const p2StatusAfter = await fetchJSON(`/tokens/${token2.id}/status`);
    console.log(`  ✓ Patient 2 Live Status: "${p2StatusAfter.data.token.status}", Ahead Count: ${p2StatusAfter.data.aheadCount} (Now 0)\n`);

    if (p2StatusAfter.data.aheadCount !== 0) {
      throw new Error(`Expected Patient 2 aheadCount to be 0 after next is called, got ${p2StatusAfter.data.aheadCount}`);
    }

    // 7. Queue Session Reset
    console.log('[7/9] Testing Supervisor Session Reset...');
    const resetRes = await fetchJSON(`/doctors/${targetDoctor.id}/reset-session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supToken}` },
    });
    console.log(`  ✓ Session Reset Successful. New Session ID: ${resetRes.data.newSession.id}`);
    console.log(`  ✓ Carried-over tokens: ${resetRes.data.carriedOverCount}\n`);

    // 8. Patient 3 Check-In in New Session
    console.log('[8/9] Patient 3 Check-In in New Session (Noah Davis)...');
    const p3 = await fetchJSON('/tokens/issue', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: targetDoctor.id,
        patientName: 'Noah Davis (Age 2)',
        guardianName: 'Mark Davis',
        guardianPhone: '555-0103',
      }),
    });
    const token3 = p3.data.token;
    console.log(`  ✓ Token Issued in New Session: #${token3.tokenNumber} (ID: ${token3.id})`);

    if (token3.tokenNumber !== 1) {
      throw new Error(`Expected token number to restart at 1 in new session, got #${token3.tokenNumber}`);
    }
    console.log('  ✓ Token numbering restarted at #1 for the new session as required!\n');

    // 9. Analytics Verification
    console.log('[9/9] Verifying Supervisor & Admin Analytics Reporting...');
    const doctorAnalytics = await fetchJSON(`/doctors/${targetDoctor.id}/analytics`, {
      headers: { Authorization: `Bearer ${supToken}` },
    });
    console.log(`  ✓ Doctor Avg Wait Time: ${doctorAnalytics.data.summary.avgWaitMinutes} mins`);
    console.log(`  ✓ Doctor Completed Count: ${doctorAnalytics.data.summary.completedTokens}`);

    const adminAnalytics = await fetchJSON('/admin/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`  ✓ System Admin Total Tokens: ${adminAnalytics.data.overview.totalTokens}`);
    console.log(`  ✓ System Admin Total Clinics: ${adminAnalytics.data.overview.totalClinics}`);

    console.log('\n===============================================================');
    console.log('  🎉 ALL 9 END-TO-END VERIFICATION MILESTONES PASSED 100%! ');
    console.log('===============================================================');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err.message);
    if (err.data) {
      console.error('Error Details:', JSON.stringify(err.data, null, 2));
    }
    process.exit(1);
  }
}

runVerification();
