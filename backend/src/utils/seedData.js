const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const Queue = require('../models/Queue');
const QueueEntry = require('../models/QueueEntry');
const Notification = require('../models/Notification');

async function seedDatabase() {
  console.log('[Seed] Starting database population...');
  await connectDB();

  // Clear existing records
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Service.deleteMany({});
  await Counter.deleteMany({});
  await Queue.deleteMany({});
  await QueueEntry.deleteMany({});
  await Notification.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  const customerHash = await bcrypt.hash('customer123', 10);

  // 1. Create Organizations
  const cityCare = await Organization.create({
    name: 'CityCare Hospital',
    type: 'hospital',
    address: '450 Healthcare Boulevard, Metro District',
    contact: '+1 (555) 234-5678',
    tagline: 'Compassionate Care, Seamless Experience',
    status: 'active'
  });

  const apexBank = await Organization.create({
    name: 'Apex Global Bank',
    type: 'bank',
    address: '100 Financial Center, Tower A',
    contact: '+1 (555) 789-0123',
    tagline: 'Next-Generation Smart Banking Solutions',
    status: 'active'
  });

  const quickFix = await Organization.create({
    name: 'QuickFix Tech Service Center',
    type: 'service_center',
    address: '88 Innovation Park, Cyber Hub',
    contact: '+1 (555) 456-7890',
    tagline: 'Rapid Diagnostics & Certified Support',
    status: 'active'
  });

  // 2. Create Services
  // Hospital Services
  const generalConsultation = await Service.create({
    organizationId: cityCare._id || cityCare.id,
    name: 'General Consultation',
    description: 'Outpatient consultations and general physician diagnostics',
    averageServiceTime: 6, // 6 minutes
    prefix: 'Q',
    icon: 'stethoscope',
    status: 'active'
  });

  const pharmacy = await Service.create({
    organizationId: cityCare._id || cityCare.id,
    name: 'Pharmacy',
    description: 'Prescription dispensing and medication counseling',
    averageServiceTime: 4,
    prefix: 'P',
    icon: 'pill',
    status: 'active'
  });

  const laboratory = await Service.create({
    organizationId: cityCare._id || cityCare.id,
    name: 'Laboratory',
    description: 'Blood sample collection, tests, and clinical pathology',
    averageServiceTime: 5,
    prefix: 'L',
    icon: 'flask-conical',
    status: 'active'
  });

  const billing = await Service.create({
    organizationId: cityCare._id || cityCare.id,
    name: 'Billing',
    description: 'Inpatient & outpatient invoice processing, insurance claims, and payments',
    averageServiceTime: 4,
    prefix: 'B',
    icon: 'receipt',
    status: 'active'
  });

  const registration = await Service.create({
    organizationId: cityCare._id || cityCare.id,
    name: 'Registration',
    description: 'Patient check-in, appointments, medical record creation, and visitor badges',
    averageServiceTime: 3,
    prefix: 'REG',
    icon: 'clipboard-list',
    status: 'active'
  });

  // Bank Services
  const cashCounter = await Service.create({
    organizationId: apexBank._id || apexBank.id,
    name: 'Cash Counter',
    description: 'Deposits, withdrawals, and currency exchange',
    averageServiceTime: 3,
    prefix: 'C',
    icon: 'banknote',
    status: 'active'
  });

  const accountServices = await Service.create({
    organizationId: apexBank._id || apexBank.id,
    name: 'Account Services',
    description: 'Account opening, KYC updates, and netbanking queries',
    averageServiceTime: 8,
    prefix: 'A',
    icon: 'credit-card',
    status: 'active'
  });

  const loanServices = await Service.create({
    organizationId: apexBank._id || apexBank.id,
    name: 'Loan Services',
    description: 'Mortgage, personal, and commercial loan advisory',
    averageServiceTime: 12,
    prefix: 'M',
    icon: 'landmark',
    status: 'active'
  });

  // Service Center Services
  const techSupport = await Service.create({
    organizationId: quickFix._id || quickFix.id,
    name: 'Customer Support',
    description: 'Warranty inquiries, software triage, and device queries',
    averageServiceTime: 5,
    prefix: 'S',
    icon: 'headphones',
    status: 'active'
  });

  const repairService = await Service.create({
    organizationId: quickFix._id || quickFix.id,
    name: 'Repair',
    description: 'Hardware diagnostics and component replacements',
    averageServiceTime: 10,
    prefix: 'R',
    icon: 'wrench',
    status: 'active'
  });

  const documentationService = await Service.create({
    organizationId: quickFix._id || quickFix.id,
    name: 'Documentation',
    description: 'Return approvals, claims, and invoice reissuance',
    averageServiceTime: 4,
    prefix: 'D',
    icon: 'file-text',
    status: 'active'
  });

  // 3. Create Counters
  const counterHospital1 = await Counter.create({
    organizationId: cityCare._id || cityCare.id,
    serviceId: generalConsultation._id || generalConsultation.id,
    counterNumber: 'Counter 1',
    status: 'open'
  });

  const counterHospital2 = await Counter.create({
    organizationId: cityCare._id || cityCare.id,
    serviceId: generalConsultation._id || generalConsultation.id,
    counterNumber: 'Counter 2',
    status: 'open'
  });

  const counterHospitalPharm = await Counter.create({
    organizationId: cityCare._id || cityCare.id,
    serviceId: pharmacy._id || pharmacy.id,
    counterNumber: 'Counter 3',
    status: 'open'
  });

  const counterBank1 = await Counter.create({
    organizationId: apexBank._id || apexBank.id,
    serviceId: cashCounter._id || cashCounter.id,
    counterNumber: 'Counter 1',
    status: 'open'
  });

  const counterTech1 = await Counter.create({
    organizationId: quickFix._id || quickFix.id,
    serviceId: techSupport._id || techSupport.id,
    counterNumber: 'Counter 1',
    status: 'open'
  });

  // 4. Create Users (Admin, Staff, Customers)
  const adminUser = await User.create({
    name: 'Eleanor Vance (Admin)',
    email: 'admin@qveue.com',
    phone: '+1 (555) 000-1111',
    passwordHash: adminHash,
    role: 'admin',
    createdAt: new Date().toISOString()
  });

  const staffHospital = await User.create({
    name: 'Dr. Sarah Patel',
    email: 'sarah.patel@citycare.org',
    phone: '+1 (555) 111-2222',
    passwordHash: staffHash,
    role: 'staff',
    organizationId: cityCare._id || cityCare.id,
    counterId: counterHospital1._id || counterHospital1.id,
    createdAt: new Date().toISOString()
  });

  const staffBank = await User.create({
    name: 'Mark Adams',
    email: 'mark.adams@apexbank.com',
    phone: '+1 (555) 222-3333',
    passwordHash: staffHash,
    role: 'staff',
    organizationId: apexBank._id || apexBank.id,
    counterId: counterBank1._id || counterBank1.id,
    createdAt: new Date().toISOString()
  });

  const staffTech = await User.create({
    name: 'Lisa Chen',
    email: 'lisa.chen@quickfix.com',
    phone: '+1 (555) 333-4444',
    passwordHash: staffHash,
    role: 'staff',
    organizationId: quickFix._id || quickFix.id,
    counterId: counterTech1._id || counterTech1.id,
    createdAt: new Date().toISOString()
  });

  // Assign staff to counter
  await Counter.findByIdAndUpdate(counterHospital1._id || counterHospital1.id, { staffId: staffHospital._id || staffHospital.id });
  await Counter.findByIdAndUpdate(counterBank1._id || counterBank1.id, { staffId: staffBank._id || staffBank.id });
  await Counter.findByIdAndUpdate(counterTech1._id || counterTech1.id, { staffId: staffTech._id || staffTech.id });

  // Customers
  const customerShankar = await User.create({
    name: 'Shankar',
    email: 'shankar@example.com',
    phone: '+1 (555) 999-0001',
    passwordHash: customerHash,
    role: 'customer',
    createdAt: new Date().toISOString()
  });

  const customerPriya = await User.create({
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+1 (555) 999-0002',
    passwordHash: customerHash,
    role: 'customer',
    createdAt: new Date().toISOString()
  });

  const customerDavid = await User.create({
    name: 'David Miller',
    email: 'david@example.com',
    phone: '+1 (555) 999-0003',
    passwordHash: customerHash,
    role: 'customer',
    createdAt: new Date().toISOString()
  });

  // 5. Create Active Queue for CityCare General Consultation
  const today = new Date().toISOString().split('T')[0];
  const hospitalQueue = await Queue.create({
    organizationId: cityCare._id || cityCare.id,
    serviceId: generalConsultation._id || generalConsultation.id,
    date: today,
    status: 'active',
    currentToken: 'Q-018',
    currentTokenNumber: 18,
    lastIssuedNumber: 24,
    createdAt: new Date().toISOString()
  });

  // Currently serving customer for Q-018: Anita Roy
  const servingEntry = await QueueEntry.create({
    queueId: hospitalQueue._id || hospitalQueue.id,
    organizationId: cityCare._id || cityCare.id,
    serviceId: generalConsultation._id || generalConsultation.id,
    customerId: null,
    customerName: 'Anita Roy',
    customerPhone: '+1 (555) 888-0018',
    tokenNumber: 'Q-018',
    sequenceNumber: 18,
    status: 'calling',
    counterId: counterHospital1._id || counterHospital1.id,
    counterNumber: 'Counter 1',
    servedBy: staffHospital._id || staffHospital.id,
    calledAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    joinedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  });

  await Queue.findByIdAndUpdate(hospitalQueue._id || hospitalQueue.id, {
    currentEntryId: servingEntry._id || servingEntry.id
  });

  // 5 customers ahead between Q-019 and Q-023
  const aheadCustomers = [
    { name: 'Rahul Verma', phone: '+1 (555) 888-0019', seq: 19, token: 'Q-019' },
    { name: 'Sneha Gupta', phone: '+1 (555) 888-0020', seq: 20, token: 'Q-020' },
    { name: 'Mohammed Ali', phone: '+1 (555) 888-0021', seq: 21, token: 'Q-021' },
    { name: 'Vikram Malhotra', phone: '+1 (555) 888-0022', seq: 22, token: 'Q-022' },
    { name: 'Pooja Reddy', phone: '+1 (555) 888-0023', seq: 23, token: 'Q-023' }
  ];

  for (const c of aheadCustomers) {
    await QueueEntry.create({
      queueId: hospitalQueue._id || hospitalQueue.id,
      organizationId: cityCare._id || cityCare.id,
      serviceId: generalConsultation._id || generalConsultation.id,
      customerId: null,
      customerName: c.name,
      customerPhone: c.phone,
      tokenNumber: c.token,
      sequenceNumber: c.seq,
      status: 'waiting',
      joinedAt: new Date(Date.now() - (25 - c.seq + 18) * 60 * 1000).toISOString()
    });
  }

  // Customer Shankar with Token Q-024 (Exactly 5 people ahead, ~18 min wait!)
  const shankarTicket = await QueueEntry.create({
    queueId: hospitalQueue._id || hospitalQueue.id,
    organizationId: cityCare._id || cityCare.id,
    serviceId: generalConsultation._id || generalConsultation.id,
    customerId: customerShankar._id || customerShankar.id,
    customerName: customerShankar.name,
    customerPhone: customerShankar.phone,
    tokenNumber: 'Q-024',
    sequenceNumber: 24,
    status: 'waiting',
    joinedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  });

  // In-app Notification for Shankar
  await Notification.create({
    customerId: customerShankar._id || customerShankar.id,
    queueEntryId: shankarTicket._id || shankarTicket.id,
    title: 'Joined Queue: General Consultation',
    message: 'You joined General Consultation at CityCare Hospital. Your Token is Q-024. 5 people ahead, estimated wait: 18 minutes.',
    type: 'joined',
    metadata: {
      tokenNumber: 'Q-024',
      peopleAhead: 5,
      estimatedMinutes: 18
    },
    read: false,
    createdAt: new Date().toISOString()
  });

  // Also add some completed tickets today for realistic stats
  const completedEntries = [
    { token: 'Q-015', name: 'Robert King', seq: 15, durationMin: 6 },
    { token: 'Q-016', name: 'Emily Clark', seq: 16, durationMin: 5 },
    { token: 'Q-017', name: 'Daniel Lewis', seq: 17, durationMin: 7 }
  ];

  for (const c of completedEntries) {
    const called = new Date(Date.now() - (45 - c.seq) * 60 * 1000);
    const completed = new Date(called.getTime() + c.durationMin * 60 * 1000);
    await QueueEntry.create({
      queueId: hospitalQueue._id || hospitalQueue.id,
      organizationId: cityCare._id || cityCare.id,
      serviceId: generalConsultation._id || generalConsultation.id,
      customerName: c.name,
      tokenNumber: c.token,
      sequenceNumber: c.seq,
      status: 'completed',
      counterNumber: 'Counter 1',
      servedBy: staffHospital._id || staffHospital.id,
      joinedAt: new Date(called.getTime() - 15 * 60 * 1000).toISOString(),
      calledAt: called.toISOString(),
      completedAt: completed.toISOString()
    });
  }

  // 6. Create Bank Queue: Apex Cash Counter (C-005 serving)
  const bankQueue = await Queue.create({
    organizationId: apexBank._id || apexBank.id,
    serviceId: cashCounter._id || cashCounter.id,
    date: today,
    status: 'active',
    currentToken: 'C-005',
    currentTokenNumber: 5,
    lastIssuedNumber: 8,
    createdAt: new Date().toISOString()
  });

  await QueueEntry.create({
    queueId: bankQueue._id || bankQueue.id,
    organizationId: apexBank._id || apexBank.id,
    serviceId: cashCounter._id || cashCounter.id,
    customerName: 'George Harris',
    tokenNumber: 'C-005',
    sequenceNumber: 5,
    status: 'calling',
    counterNumber: 'Counter 1',
    servedBy: staffBank._id || staffBank.id,
    calledAt: new Date().toISOString(),
    joinedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  });

  for (let s = 6; s <= 8; s++) {
    await QueueEntry.create({
      queueId: bankQueue._id || bankQueue.id,
      organizationId: apexBank._id || apexBank.id,
      serviceId: cashCounter._id || cashCounter.id,
      customerName: `Bank Customer #${s}`,
      customerPhone: `987654300${s}`,
      tokenNumber: `C-00${s}`,
      sequenceNumber: s,
      status: 'waiting',
      joinedAt: new Date(Date.now() - (9 - s) * 5 * 60 * 1000).toISOString()
    });
  }

  // 7. Create Tech Center Queue: QuickFix Customer Support (S-002 serving)
  const techQueue = await Queue.create({
    organizationId: quickFix._id || quickFix.id,
    serviceId: techSupport._id || techSupport.id,
    date: today,
    status: 'active',
    currentToken: 'S-002',
    currentTokenNumber: 2,
    lastIssuedNumber: 5,
    createdAt: new Date().toISOString()
  });

  await QueueEntry.create({
    queueId: techQueue._id || techQueue.id,
    organizationId: quickFix._id || quickFix.id,
    serviceId: techSupport._id || techSupport.id,
    customerName: 'Samira Jones',
    customerPhone: '9876543102',
    tokenNumber: 'S-002',
    sequenceNumber: 2,
    status: 'calling',
    counterNumber: 'Counter 1',
    servedBy: staffTech._id || staffTech.id,
    calledAt: new Date().toISOString(),
    joinedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  });

  for (let s = 3; s <= 5; s++) {
    await QueueEntry.create({
      queueId: techQueue._id || techQueue.id,
      organizationId: quickFix._id || quickFix.id,
      serviceId: techSupport._id || techSupport.id,
      customerName: `Tech Client #${s}`,
      customerPhone: `987654310${s}`,
      tokenNumber: `S-00${s}`,
      sequenceNumber: s,
      status: 'waiting',
      joinedAt: new Date(Date.now() - (6 - s) * 4 * 60 * 1000).toISOString()
    });
  }

  console.log('✓ [Seed] Complete! Demo data successfully seeded:');
  console.log('   - 3 Organizations (CityCare Hospital, Apex Global Bank, QuickFix Tech Support)');
  console.log('   - 9 Services with customized average service times and prefixes');
  console.log('   - Active Queue for CityCare General Consultation with Shankar (Q-024) 5 ahead, ~18m wait');
  console.log('   - Staff accounts: sarah.patel@citycare.org, mark.adams@apexbank.com, lisa.chen@quickfix.com (pass: staff123)');
  console.log('   - Admin account: admin@qveue.com (pass: admin123)');
  console.log('   - Customer account: shankar@example.com (pass: customer123)');
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('[Seed] Script finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
