import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Society ──────────────────────────────────────────────
  const society = await prisma.society.upsert({
    where: { id: 'society-sunrise-heights' },
    update: {},
    create: {
      id: 'society-sunrise-heights',
      name: 'Sunrise Heights',
      address: '123 MG Road, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      totalUnits: 10,
    },
  });
  console.log(`  ✓ Society: ${society.name}`);

  // ── Units ────────────────────────────────────────────────
  const unitData = [
    { id: 'unit-a101', identifier: 'A-101', block: 'A', floor: 1 },
    { id: 'unit-a102', identifier: 'A-102', block: 'A', floor: 1 },
    { id: 'unit-a201', identifier: 'A-201', block: 'A', floor: 2 },
    { id: 'unit-a202', identifier: 'A-202', block: 'A', floor: 2 },
    { id: 'unit-a301', identifier: 'A-301', block: 'A', floor: 3 },
    { id: 'unit-b101', identifier: 'B-101', block: 'B', floor: 1 },
    { id: 'unit-b102', identifier: 'B-102', block: 'B', floor: 1 },
    { id: 'unit-b201', identifier: 'B-201', block: 'B', floor: 2 },
    { id: 'unit-b202', identifier: 'B-202', block: 'B', floor: 2 },
    { id: 'unit-b301', identifier: 'B-301', block: 'B', floor: 3 },
  ];

  for (const u of unitData) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, societyId: society.id },
    });
  }
  console.log(`  ✓ Units: ${unitData.length} created`);

  // ── Users ────────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: {},
    create: {
      id: 'user-owner-1',
      phone: '9876543210',
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      unitId: 'unit-a101',
      societyId: society.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ User (Owner): ${owner.name}`);

  const tenant = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: {},
    create: {
      id: 'user-tenant-1',
      phone: '9876543211',
      name: 'Priya Sharma',
      unitId: 'unit-a201',
      societyId: society.id,
      role: 'TENANT',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ User (Tenant): ${tenant.name}`);

  const householdMember = await prisma.user.upsert({
    where: { phone: '9876543212' },
    update: {},
    create: {
      id: 'user-household-1',
      phone: '9876543212',
      name: 'Anita Kumar',
      unitId: 'unit-a101', // Same unit as owner — multi-resident per unit
      societyId: society.id,
      role: 'HOUSEHOLD_MEMBER',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ User (Household): ${householdMember.name}`);

  const pendingUser = await prisma.user.upsert({
    where: { phone: '9876543213' },
    update: {},
    create: {
      id: 'user-pending-1',
      phone: '9876543213',
      name: 'Vikram Singh',
      unitId: 'unit-b101',
      societyId: society.id,
      role: 'OWNER',
      status: 'PENDING_APPROVAL',
    },
  });
  console.log(`  ✓ User (Pending): ${pendingUser.name}`);

  // ── Notification Preferences (for active users) ──────────
  const categories = ['SECURITY', 'BILLING', 'SOCIETY_NOTICE', 'COMPLAINT_UPDATE', 'COMMERCIAL'] as const;
  for (const user of [owner, tenant, householdMember]) {
    for (const category of categories) {
      await prisma.notificationPreference.upsert({
        where: {
          userId_category: { userId: user.id, category },
        },
        update: {},
        create: {
          userId: user.id,
          category,
          enabled: category === 'COMMERCIAL' ? false : true, // COMMERCIAL off by default
        },
      });
    }
  }
  console.log('  ✓ Notification preferences created');

  // ── Sample Bills ─────────────────────────────────────────
  const now = new Date();

  // Bill 1: PAID bill from last month (unit A-101)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 5);
  await prisma.bill.upsert({
    where: { id: 'bill-paid-1' },
    update: {},
    create: {
      id: 'bill-paid-1',
      unitId: 'unit-a101',
      societyId: society.id,
      amountDue: 5500,
      amountPaid: 5500,
      dueDate: lastMonth,
      breakdown: [
        { label: 'Maintenance', amount: 4000 },
        { label: 'Water', amount: 500 },
        { label: 'Sinking Fund', amount: 500 },
        { label: 'Parking', amount: 500 },
      ],
      status: 'PAID',
      paymentId: 'pay_mock_paid001',
      paidAt: new Date(lastMonth.getTime() - 3 * 24 * 60 * 60 * 1000), // paid 3 days before due
      receiptUrl: 'receipt://bill-paid-1/pay_mock_paid001',
    },
  });
  console.log('  ✓ Sample bill (PAID — last month)');

  // Bill 2: PENDING bill due next month (unit A-101)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);
  await prisma.bill.upsert({
    where: { id: 'bill-pending-1' },
    update: {},
    create: {
      id: 'bill-pending-1',
      unitId: 'unit-a101',
      societyId: society.id,
      amountDue: 5500,
      amountPaid: 0,
      dueDate: nextMonth,
      breakdown: [
        { label: 'Maintenance', amount: 4000 },
        { label: 'Water', amount: 500 },
        { label: 'Sinking Fund', amount: 500 },
        { label: 'Parking', amount: 500 },
      ],
      status: 'PENDING',
    },
  });
  console.log('  ✓ Sample bill (PENDING — next month)');

  // Bill 3: OVERDUE bill from 2 months ago (unit A-101)
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 5);
  await prisma.bill.upsert({
    where: { id: 'bill-overdue-1' },
    update: {},
    create: {
      id: 'bill-overdue-1',
      unitId: 'unit-a101',
      societyId: society.id,
      amountDue: 5500,
      amountPaid: 0,
      dueDate: twoMonthsAgo,
      breakdown: [
        { label: 'Maintenance', amount: 4000 },
        { label: 'Water', amount: 500 },
        { label: 'Sinking Fund', amount: 500 },
        { label: 'Parking', amount: 500 },
      ],
      status: 'OVERDUE',
    },
  });
  console.log('  ✓ Sample bill (OVERDUE — 2 months ago)');

  // Bill 4: PENDING bill for tenant's unit A-201
  await prisma.bill.upsert({
    where: { id: 'bill-pending-2' },
    update: {},
    create: {
      id: 'bill-pending-2',
      unitId: 'unit-a201',
      societyId: society.id,
      amountDue: 4800,
      amountPaid: 0,
      dueDate: nextMonth,
      breakdown: [
        { label: 'Maintenance', amount: 3500 },
        { label: 'Water', amount: 500 },
        { label: 'Sinking Fund', amount: 400 },
        { label: 'Parking', amount: 400 },
      ],
      status: 'PENDING',
    },
  });
  console.log('  ✓ Sample bill (PENDING — tenant unit A-201)');

  // Bill 5: PAID bill from 3 months ago (unit A-101) — for paid-this-year calc
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 5);
  await prisma.bill.upsert({
    where: { id: 'bill-paid-2' },
    update: {},
    create: {
      id: 'bill-paid-2',
      unitId: 'unit-a101',
      societyId: society.id,
      amountDue: 5500,
      amountPaid: 5500,
      dueDate: threeMonthsAgo,
      breakdown: [
        { label: 'Maintenance', amount: 4000 },
        { label: 'Water', amount: 500 },
        { label: 'Sinking Fund', amount: 500 },
        { label: 'Parking', amount: 500 },
      ],
      status: 'PAID',
      paymentId: 'pay_mock_paid002',
      paidAt: new Date(threeMonthsAgo.getTime() - 5 * 24 * 60 * 60 * 1000),
      receiptUrl: 'receipt://bill-paid-2/pay_mock_paid002',
    },
  });
  console.log('  ✓ Sample bill (PAID — 3 months ago)');

  // ── Sample Complaints ──────────────────────────────────────
  // Complaint 1: OPEN — Plumbing, MEDIUM priority (existing, refreshed)
  const slaMedium = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
  await prisma.complaint.upsert({
    where: { id: 'complaint-1' },
    update: {},
    create: {
      id: 'complaint-1',
      unitId: 'unit-a101',
      societyId: society.id,
      createdByUserId: owner.id,
      category: 'PLUMBING',
      description: 'Water leakage in the kitchen pipe near the sink. Dripping constantly and causing water to pool on the floor.',
      photoUrls: [],
      priority: 'MEDIUM',
      status: 'OPEN',
      slaDueAt: slaMedium,
    },
  });
  console.log('  ✓ Sample complaint (OPEN — Plumbing/Medium)');

  // Complaint 2: ACKNOWLEDGED — Electrical, HIGH priority (nearing SLA)
  const slaHighNearing = new Date(now.getTime() + 4 * 60 * 60 * 1000); // only 4 hours remaining
  const acknowledgedAt = new Date(now.getTime() - 18 * 60 * 60 * 1000); // acknowledged 18 hours ago
  await prisma.complaint.upsert({
    where: { id: 'complaint-2' },
    update: {},
    create: {
      id: 'complaint-2',
      unitId: 'unit-a101',
      societyId: society.id,
      createdByUserId: owner.id,
      category: 'ELECTRICAL',
      description: 'Power fluctuation in the living room. Lights flicker every few minutes. Could be a wiring issue.',
      photoUrls: [],
      priority: 'HIGH',
      status: 'ACKNOWLEDGED',
      slaDueAt: slaHighNearing,
      acknowledgedAt,
    },
  });
  console.log('  ✓ Sample complaint (ACKNOWLEDGED — Electrical/High, nearing SLA)');

  // Complaint 3: IN_PROGRESS — Common Area, LOW priority
  const slaLow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days remaining
  await prisma.complaint.upsert({
    where: { id: 'complaint-3' },
    update: {},
    create: {
      id: 'complaint-3',
      unitId: 'unit-a101',
      societyId: society.id,
      createdByUserId: householdMember.id,
      category: 'COMMON_AREA',
      description: 'The garden area lights on the ground floor pathway are not working. Makes it difficult to walk at night.',
      photoUrls: [],
      priority: 'LOW',
      status: 'IN_PROGRESS',
      slaDueAt: slaLow,
      acknowledgedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('  ✓ Sample complaint (IN_PROGRESS — Common Area/Low)');

  // Complaint 4: RESOLVED — Security, HIGH priority (resolved within SLA)
  const resolvedCreatedAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  const resolvedSla = new Date(resolvedCreatedAt.getTime() + 24 * 60 * 60 * 1000); // 24h SLA
  const resolvedAtTime = new Date(resolvedCreatedAt.getTime() + 18 * 60 * 60 * 1000); // resolved in 18 hours
  await prisma.complaint.upsert({
    where: { id: 'complaint-4' },
    update: {},
    create: {
      id: 'complaint-4',
      unitId: 'unit-a101',
      societyId: society.id,
      createdByUserId: owner.id,
      category: 'SECURITY',
      description: 'CCTV camera in parking area B is not functioning. Noticed it has been offline for 2 days.',
      photoUrls: [],
      priority: 'HIGH',
      status: 'RESOLVED',
      slaDueAt: resolvedSla,
      acknowledgedAt: new Date(resolvedCreatedAt.getTime() + 2 * 60 * 60 * 1000),
      resolvedAt: resolvedAtTime,
      createdAt: resolvedCreatedAt,
    },
  });
  console.log('  ✓ Sample complaint (RESOLVED — Security/High, within SLA)');

  // Complaint 5: OPEN — Plumbing for tenant unit A-201
  const slaTenant = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours remaining
  await prisma.complaint.upsert({
    where: { id: 'complaint-5' },
    update: {},
    create: {
      id: 'complaint-5',
      unitId: 'unit-a201',
      societyId: society.id,
      createdByUserId: tenant.id,
      category: 'PLUMBING',
      description: 'Bathroom exhaust fan making loud noise. Possible motor issue that needs replacement.',
      photoUrls: [],
      priority: 'MEDIUM',
      status: 'OPEN',
      slaDueAt: slaTenant,
    },
  });
  console.log('  ✓ Sample complaint (OPEN — Plumbing/Medium, tenant unit A-201)');

  // ── Guard ─────────────────────────────────────────────────
  // PIN: 123456  (bcrypt hashed)
  const guardPinHash = '$2b$10$/aqVrUXPQrMW17FwM3DAoeGBmh5LFoySg2qIelqPqWsWKOk1rgaIa';
  const guard = await prisma.guard.upsert({
    where: { staffId: 'GUARD001' },
    update: {},
    create: {
      id: 'guard-001',
      staffId: 'GUARD001',
      pin: guardPinHash,
      name: 'Ramesh Kumar',
      societyId: society.id,
      isActive: true,
    },
  });
  console.log(`  ✓ Guard: ${guard.name} (staffId: ${guard.staffId}, PIN: 123456)`);

  // ── Sample Visitors (for committee dashboard) ──────────────────────
  // Visitor 1: APPROVED — Delivery to A-101
  await prisma.visitor.upsert({
    where: { id: 'visitor-1' },
    update: {},
    create: {
      id: 'visitor-1',
      name: 'Arun Delivery',
      phone: '9000000001',
      purpose: 'DELIVERY',
      purposeNote: 'Amazon package',
      unitId: 'unit-a101',
      societyId: society.id,
      guardId: guard.id,
      createdBy: 'GUARD',
      status: 'APPROVED',
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
      respondedAt: new Date(now.getTime() - 5 * 60 * 1000),
      respondedByUserId: owner.id,
      entryAt: new Date(now.getTime() - 4 * 60 * 1000),
    },
  });
  console.log('  ✓ Sample visitor (APPROVED — Delivery)');

  // Visitor 2: DENIED — Guest to A-201
  await prisma.visitor.upsert({
    where: { id: 'visitor-2' },
    update: {},
    create: {
      id: 'visitor-2',
      name: 'Unknown Person',
      phone: '9000000002',
      purpose: 'GUEST',
      unitId: 'unit-a201',
      societyId: society.id,
      guardId: guard.id,
      createdBy: 'GUARD',
      status: 'DENIED',
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
      respondedAt: new Date(now.getTime() - 15 * 60 * 1000),
      respondedByUserId: tenant.id,
    },
  });
  console.log('  ✓ Sample visitor (DENIED — Guest)');

  // Visitor 3: PENDING — Maintenance worker at gate right now
  await prisma.visitor.upsert({
    where: { id: 'visitor-3' },
    update: {},
    create: {
      id: 'visitor-3',
      name: 'Suresh Plumber',
      phone: '9000000003',
      purpose: 'MAINTENANCE',
      purposeNote: 'Called for kitchen leak repair',
      unitId: 'unit-a101',
      societyId: society.id,
      guardId: guard.id,
      createdBy: 'GUARD',
      status: 'PENDING',
      expiresAt: new Date(now.getTime() + 3 * 60 * 1000),
    },
  });
  console.log('  ✓ Sample visitor (PENDING — Maintenance)');

  // Visitor 4: EXPIRED — Cab driver who wasn't approved in time
  const yesterdayEvening = new Date(now.getTime() - 18 * 60 * 60 * 1000);
  await prisma.visitor.upsert({
    where: { id: 'visitor-4' },
    update: {},
    create: {
      id: 'visitor-4',
      name: 'Ola Driver',
      phone: '9000000004',
      purpose: 'CAB',
      unitId: 'unit-a201',
      societyId: society.id,
      guardId: guard.id,
      createdBy: 'GUARD',
      status: 'EXPIRED',
      expiresAt: new Date(yesterdayEvening.getTime() + 3 * 60 * 1000),
      respondedAt: new Date(yesterdayEvening.getTime() + 3 * 60 * 1000),
      createdAt: yesterdayEvening,
    },
  });
  console.log('  ✓ Sample visitor (EXPIRED — Cab)');

  // ── Sample Notice ────────────────────────────────────────────────────
  await prisma.notice.upsert({
    where: { id: 'notice-1' },
    update: {},
    create: {
      id: 'notice-1',
      societyId: society.id,
      createdByUserId: owner.id,
      title: 'Water Supply Disruption — July 5th',
      body: 'Municipal water supply will be disrupted on July 5th from 10 AM to 4 PM for pipeline maintenance. Please store adequate water in advance.',
      requiresAcknowledgment: true,
      acknowledgedByUserIds: [],
    },
  });
  console.log('  ✓ Sample notice (Water Supply)');

  // Notice 2: Annual General Meeting
  await prisma.notice.upsert({
    where: { id: 'notice-2' },
    update: {},
    create: {
      id: 'notice-2',
      societyId: society.id,
      createdByUserId: owner.id,
      title: 'Annual General Meeting — July 15th',
      body: 'The Annual General Meeting for Sunrise Heights will be held on July 15th at 6:00 PM in the community hall. All owners are requested to attend. Agenda includes budget review, maintenance fee revision, and security improvements.',
      requiresAcknowledgment: true,
      acknowledgedByUserIds: [owner.id],
    },
  });
  console.log('  ✓ Sample notice (AGM)');

  // Notice 3: Parking reminder (no acknowledgment)
  await prisma.notice.upsert({
    where: { id: 'notice-3' },
    update: {},
    create: {
      id: 'notice-3',
      societyId: society.id,
      createdByUserId: owner.id,
      title: 'Parking Guidelines Reminder',
      body: 'Please park only in your designated parking spots. Vehicles parked in visitor parking for more than 24 hours will be towed. Contact the security desk for temporary parking arrangements.',
      requiresAcknowledgment: false,
      acknowledgedByUserIds: [],
    },
  });
  console.log('  ✓ Sample notice (Parking)');


  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

