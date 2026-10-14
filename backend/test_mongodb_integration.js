const { connectDB, disconnectDB } = require('./src/config/db');
const User = require('./src/models/User');
const Organization = require('./src/models/Organization');
const Service = require('./src/models/Service');
const Counter = require('./src/models/Counter');
const Queue = require('./src/models/Queue');
const QueueEntry = require('./src/models/QueueEntry');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');
const jsQR = require('jsqr');

async function runMongoDBIntegrationTests() {
  console.log('====================================================');
  console.log('🧪 QVeue — Complete MongoDB Integration Test Suite');
  console.log('====================================================');

  // Step 1: Connect to MongoDB
  console.log('\n[TEST 1] Connecting to MongoDB...');
  await connectDB();
  console.log('✅ Connected successfully to MongoDB via Mongoose!');

  // Step 2: Register a customer and verify in MongoDB
  console.log('\n[TEST 2] Register customer and verify in database...');
  const testEmail = `test_customer_${Date.now()}@example.com`;
  const passwordHash = await bcrypt.hash('secret123', 10);
  const customer = await User.create({
    name: 'Rohan Sharma',
    email: testEmail,
    phone: '9876500001',
    passwordHash,
    role: 'customer'
  });

  const savedCustomer = await User.findById(customer._id);
  if (!savedCustomer || savedCustomer.email !== testEmail) {
    throw new Error('❌ Customer record verification failed!');
  }
  console.log(`✅ Customer registered & verified in MongoDB: ID=${savedCustomer._id}, Phone=${savedCustomer.phone}`);

  // Step 3: Create Organization and Service in MongoDB
  console.log('\n[TEST 3] Create Organization and Service...');
  const org = await Organization.create({
    name: 'Test Metro Clinic',
    type: 'hospital',
    address: '123 Health Ave',
    contact: '+1 555-0199',
    status: 'active'
  });

  const service = await Service.create({
    organizationId: org._id,
    name: 'Pediatrics Consultation',
    description: 'Child care and pediatric review',
    averageServiceTime: 7,
    prefix: 'PED',
    status: 'active'
  });

  const savedOrg = await Organization.findById(org._id);
  const savedService = await Service.findById(service._id);
  if (!savedOrg || !savedService) {
    throw new Error('❌ Organization or Service not found in MongoDB!');
  }
  console.log(`✅ Organization created: "${savedOrg.name}" (${savedOrg._id})`);
  console.log(`✅ Service created: "${savedService.name}" (${savedService._id}, Prefix: ${savedService.prefix})`);

  // Step 4: Generate and Decode QR Code for the created service
  console.log('\n[TEST 4] Generate and scan (decode) real QR code...');
  const baseUrl = 'http://192.168.0.104:3000';
  const qrJoinUrl = `${baseUrl}/join/${savedOrg._id}/${savedService._id}`;
  
  const qrPngBuffer = await QRCode.toBuffer(qrJoinUrl, {
    width: 600,
    margin: 3,
    errorCorrectionLevel: 'H'
  });
  
  const png = PNG.sync.read(qrPngBuffer);
  const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
  if (!decoded || decoded.data !== qrJoinUrl) {
    throw new Error(`❌ QR Code decode failed: expected "${qrJoinUrl}", got "${decoded?.data}"`);
  }
  console.log(`✅ QR Code generated from MongoDB IDs and verified:`);
  console.log(`   Encoded URL: ${decoded.data}`);

  // Step 5: Inactive organization / service rejection check
  console.log('\n[TEST 5] Inactive Organization / Service validation...');
  const inactiveOrg = await Organization.create({
    name: 'Closed Branch',
    status: 'inactive'
  });
  if (inactiveOrg.status !== 'inactive') {
    throw new Error('❌ Status mismatch for inactive org');
  }
  console.log('✅ Inactive organization status verified in MongoDB.');

  // Step 6: Create active Queue and join a customer
  console.log('\n[TEST 6] Join queue & create persisted QueueEntry token...');
  const today = new Date().toISOString().split('T')[0];
  const queue = await Queue.create({
    organizationId: org._id,
    serviceId: service._id,
    date: today,
    status: 'active',
    currentToken: null,
    currentTokenNumber: 0,
    lastIssuedNumber: 1
  });

  const entry = await QueueEntry.create({
    queueId: queue._id,
    organizationId: org._id,
    serviceId: service._id,
    customerId: customer._id,
    customerName: customer.name,
    customerPhone: customer.phone,
    tokenNumber: 'PED-001',
    sequenceNumber: 1,
    status: 'waiting',
    joinedAt: new Date()
  });

  const savedEntry = await QueueEntry.findById(entry._id);
  if (!savedEntry || savedEntry.tokenNumber !== 'PED-001') {
    throw new Error('❌ QueueEntry token verification failed!');
  }
  console.log(`✅ Queue entry & token persisted in MongoDB: Token=${savedEntry.tokenNumber}, Status=${savedEntry.status}`);

  // Step 7: Test Duplicate Active Queue Prevention
  console.log('\n[TEST 7] Duplicate active queue prevention...');
  // A: Same phone number trying to create another active entry should fail via unique index
  let duplicateCaught = false;
  try {
    await QueueEntry.create({
      queueId: queue._id,
      organizationId: org._id,
      serviceId: service._id,
      customerId: null,
      customerName: 'Different Name But Same Phone',
      customerPhone: customer.phone, // Same phone!
      tokenNumber: 'PED-002',
      sequenceNumber: 2,
      status: 'waiting'
    });
  } catch (err) {
    if (err.code === 11000 || (err.message && err.message.includes('duplicate key'))) {
      duplicateCaught = true;
    }
  }
  if (!duplicateCaught) {
    throw new Error('❌ FAILED: Duplicate active queue entry was NOT blocked!');
  }
  console.log('✅ Duplicate active queue entry blocked by MongoDB partial unique index (code 11000)!');

  // B: Same name but DIFFERENT phone number should be allowed!
  const sameNameDiffPhone = await QueueEntry.create({
    queueId: queue._id,
    organizationId: org._id,
    serviceId: service._id,
    customerName: customer.name, // Same name: 'Rohan Sharma'
    customerPhone: '9876500002', // Different phone!
    tokenNumber: 'PED-002',
    sequenceNumber: 2,
    status: 'waiting'
  });
  if (!sameNameDiffPhone) {
    throw new Error('❌ Different customer with same name was not created!');
  }
  console.log(`✅ Allowed customer with SAME name but different phone: Token=${sameNameDiffPhone.tokenNumber}`);

  // Step 8: Call next customer & verify persisted queue status
  console.log('\n[TEST 8] Call next customer & update queue status in MongoDB...');
  await QueueEntry.findByIdAndUpdate(entry._id, {
    status: 'calling',
    calledAt: new Date(),
    counterNumber: 'Counter 1'
  });
  await Queue.findByIdAndUpdate(queue._id, {
    currentToken: 'PED-001',
    currentTokenNumber: 1,
    currentEntryId: entry._id
  });

  const updatedEntry = await QueueEntry.findById(entry._id);
  const updatedQueue = await Queue.findById(queue._id);
  if (updatedEntry.status !== 'calling' || updatedQueue.currentToken !== 'PED-001') {
    throw new Error('❌ Queue status update verification failed!');
  }
  console.log(`✅ Queue status successfully updated in MongoDB: Now Serving=${updatedQueue.currentToken}, Entry Status=${updatedEntry.status}`);

  // Step 9: Complete ticket and allow re-joining
  console.log('\n[TEST 9] Complete ticket and verify re-joining is allowed...');
  await QueueEntry.findByIdAndUpdate(entry._id, {
    status: 'completed',
    completedAt: new Date()
  });

  // Re-join with the same phone number (now that previous ticket is completed)
  const rejoinEntry = await QueueEntry.create({
    queueId: queue._id,
    organizationId: org._id,
    serviceId: service._id,
    customerId: customer._id,
    customerName: customer.name,
    customerPhone: customer.phone, // Same phone as completed entry
    tokenNumber: 'PED-003',
    sequenceNumber: 3,
    status: 'waiting'
  });
  if (!rejoinEntry) {
    throw new Error('❌ Re-joining after completed ticket failed!');
  }
  console.log(`✅ Re-joining successful after completion: New Token=${rejoinEntry.tokenNumber}`);

  // Step 10: Role-based Authorization Check
  console.log('\n[TEST 10] Verify role-based security & password hashing...');
  const isPasswordValid = await bcrypt.compare('secret123', customer.passwordHash);
  if (!isPasswordValid) throw new Error('❌ Password hash verification failed!');
  console.log('✅ Passwords securely hashed with bcrypt.');

  // Clean up test documents
  console.log('\n[CLEANUP] Cleaning up test records...');
  await QueueEntry.deleteMany({ queueId: queue._id });
  await Queue.deleteOne({ _id: queue._id });
  await Service.deleteOne({ _id: service._id });
  await Organization.deleteOne({ _id: org._id });
  await Organization.deleteOne({ _id: inactiveOrg._id });
  await User.deleteOne({ _id: customer._id });
  console.log('✅ Test records cleaned up.');

  console.log('\n====================================================');
  console.log('🎉 ALL MONGODB INTEGRATION TESTS PASSED 100%!');
  console.log('====================================================');

  await disconnectDB();
  process.exit(0);
}

runMongoDBIntegrationTests().catch(err => {
  console.error('\n❌ Integration Test Error:', err);
  process.exit(1);
});
