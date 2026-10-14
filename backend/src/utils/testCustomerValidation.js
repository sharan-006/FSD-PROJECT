const http = require('http');

function postJSON(path, data, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data || {});
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path,
        method: 'POST',
        headers
      },
      (res) => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function getJSON(path, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    http.get(
      `http://127.0.0.1:5000${path}`,
      { headers },
      (res) => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    ).on('error', reject);
  });
}

async function runTests() {
  console.log('--- Starting Customer Duplicate & Phone Validation Tests ---');

  // 1. Fetch available services & orgs
  const orgsRes = await getJSON('/api/organizations');
  if (!orgsRes.data || !orgsRes.data.data || orgsRes.data.data.length === 0) {
    console.error('No organizations found!');
    return;
  }
  const org = orgsRes.data.data[0];
  const orgId = org._id || org.id;

  const servicesRes = await getJSON(`/api/services/org/${orgId}`);
  if (!servicesRes.data || !servicesRes.data.data || servicesRes.data.data.length === 0) {
    console.error('No services found!');
    return;
  }
  const service = servicesRes.data.data[0];
  const serviceId = service._id || service.id;

  console.log(`Using Org: "${org.name}" (${orgId}), Service: "${service.name}" (${serviceId})`);

  const phoneA = '9876543210';
  const phoneB = '9876543211';
  const simultaneousPhone = '9876543299';

  // Clean up any stale active tickets for test phones
  for (const p of [phoneA, phoneB, simultaneousPhone]) {
    try {
      const activeRes = await getJSON(`/api/queues/active/my-tickets?phone=${p}`);
      if (activeRes.data?.data) {
        for (const t of activeRes.data.data) {
          await postJSON(`/api/queues/entry/${t._id || t.id}/cancel`, {});
        }
      }
    } catch (e) {}
  }

  let testCount = 0;
  let passedCount = 0;

  function assert(condition, message) {
    testCount++;
    if (condition) {
      console.log(`✅ [PASS] Test ${testCount}: ${message}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] Test ${testCount}: ${message}`);
    }
  }

  // --- Test 6: Invalid phone -> REJECT ---
  console.log('\n--- Checking Test 6: Invalid Phone Rejections ---');
  const invalid1 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Test Customer',
    customerPhone: '98765' // Too short
  });
  assert(
    invalid1.status === 400 && invalid1.data.message === 'Please enter a valid 10-digit phone number.',
    `Short phone rejected: "${invalid1.data.message}"`
  );

  const invalid2 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Test Customer',
    customerPhone: '98765abc10' // Letters
  });
  assert(
    invalid2.status === 400 && invalid2.data.message === 'Please enter a valid 10-digit phone number.',
    `Phone with letters rejected: "${invalid2.data.message}"`
  );

  const invalid3 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Test Customer',
    customerPhone: '   ' // Spaces only
  });
  assert(
    invalid3.status === 400 && invalid3.data.message === 'Please enter a valid 10-digit phone number.',
    `Spaces-only phone rejected: "${invalid3.data.message}"`
  );

  const invalid4 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Test Customer',
    customerPhone: '98765432101234' // Too long
  });
  assert(
    invalid4.status === 400 && invalid4.data.message === 'Please enter a valid 10-digit phone number.',
    `Too long phone rejected: "${invalid4.data.message}"`
  );

  // --- Test 1: Same name + different phone -> ALLOW ---
  console.log('\n--- Checking Test 1: Same name + different phone -> ALLOW ---');

  // Join Shankar with phoneA
  const join1 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Shankar',
    customerPhone: phoneA
  });
  assert(
    join1.status === 201 && join1.data.success && join1.data.ticket?.tokenNumber,
    `Shankar – ${phoneA} successfully joined queue (Token: ${join1.data.ticket?.tokenNumber})`
  );
  const ticketA = join1.data.ticket;

  // Join Shankar with phoneB (same name, different phone)
  const join2 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Shankar',
    customerPhone: phoneB
  });
  assert(
    join2.status === 201 && join2.data.success && join2.data.ticket?.tokenNumber,
    `Shankar – ${phoneB} successfully joined queue (Token: ${join2.data.ticket?.tokenNumber})`
  );
  const ticketB = join2.data.ticket;

  // --- Test 2: Different name + same phone + active queue -> REJECT ---
  console.log('\n--- Checking Test 2: Different name + same phone + active queue -> REJECT ---');
  const join3 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Rahul',
    customerPhone: phoneA
  });
  assert(
    join3.status === 400 &&
    join3.data.error === 'ALREADY_IN_QUEUE' &&
    join3.data.existingToken === ticketA.tokenNumber &&
    join3.data.message === `You are already in this queue with token ${ticketA.tokenNumber}.`,
    `Rahul with existing phone ${phoneA} REJECTED with ALREADY_IN_QUEUE (Existing Token: ${join3.data.existingToken})`
  );

  // --- Test 3: Same name + same phone + active queue -> REJECT ---
  console.log('\n--- Checking Test 3: Same name + same phone + active queue -> REJECT ---');
  const join4 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Shankar',
    customerPhone: `+91 ${phoneA}` // Normalization check with country code
  });
  assert(
    join4.status === 400 &&
    join4.data.error === 'ALREADY_IN_QUEUE' &&
    join4.data.existingToken === ticketA.tokenNumber,
    `Shankar with same phone (+91 ${phoneA}) REJECTED with ALREADY_IN_QUEUE`
  );

  // --- Test 5: Same phone after CANCELLED -> ALLOW ---
  console.log('\n--- Checking Test 5: Same phone after CANCELLED -> ALLOW ---');
  const cancelRes = await postJSON(`/api/queues/entry/${ticketA._id || ticketA.id}/cancel`, {});
  console.log(`Cancelled ticket ${ticketA.tokenNumber}:`, cancelRes.data.message);

  const join5 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Shankar',
    customerPhone: phoneA
  });
  assert(
    join5.status === 201 && join5.data.success && join5.data.ticket?.tokenNumber,
    `Phone ${phoneA} ALLOWED to rejoin after previous ticket was CANCELLED (New Token: ${join5.data.ticket?.tokenNumber})`
  );
  const ticketA2 = join5.data.ticket;

  // --- Test 4: Same phone after COMPLETED -> ALLOW ---
  console.log('\n--- Checking Test 4: Same phone after COMPLETED -> ALLOW ---');
  const compRes = await postJSON(`/api/queues/entry/${ticketA2._id || ticketA2.id}/complete`, {});
  console.log(`Marked ticket ${ticketA2.tokenNumber} as completed:`, compRes.data.message);

  const join6 = await postJSON('/api/queues/join', {
    serviceId,
    organizationId: orgId,
    customerName: 'Shankar',
    customerPhone: phoneA
  });
  assert(
    join6.status === 201 && join6.data.success && join6.data.ticket?.tokenNumber,
    `Phone ${phoneA} ALLOWED to rejoin after previous ticket was COMPLETED (New Token: ${join6.data.ticket?.tokenNumber})`
  );

  // --- Test 7: Two simultaneous join requests -> Only 1 created ---
  console.log('\n--- Checking Test 7: Two simultaneous join requests -> Only 1 created ---');
  const [res1, res2] = await Promise.all([
    postJSON('/api/queues/join', {
      serviceId,
      organizationId: orgId,
      customerName: 'Simultaneous 1',
      customerPhone: simultaneousPhone
    }),
    postJSON('/api/queues/join', {
      serviceId,
      organizationId: orgId,
      customerName: 'Simultaneous 2',
      customerPhone: simultaneousPhone
    })
  ]);

  const oneSucceeded = (res1.status === 201 && res2.status === 400) || (res2.status === 201 && res1.status === 400);
  const oneRejectedWithDuplicate = (res1.data.error === 'ALREADY_IN_QUEUE' || res2.data.error === 'ALREADY_IN_QUEUE');
  
  assert(
    oneSucceeded && oneRejectedWithDuplicate,
    `Simultaneous join test: One request succeeded (201), the other received ALREADY_IN_QUEUE (400)!`
  );

  // Cleanup test entries created during the run
  for (const p of [phoneA, phoneB, simultaneousPhone]) {
    try {
      const activeRes = await getJSON(`/api/queues/active/my-tickets?phone=${p}`);
      if (activeRes.data?.data) {
        for (const t of activeRes.data.data) {
          await postJSON(`/api/queues/entry/${t._id || t.id}/cancel`, {});
        }
      }
    } catch (e) {}
  }

  console.log(`\n===============================================`);
  console.log(`Final Results: ${passedCount}/${testCount} tests passed.`);
  console.log(`===============================================`);
}

runTests().catch(err => console.error('Test run failed:', err));
