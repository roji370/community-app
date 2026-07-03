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
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 5);

  await prisma.bill.upsert({
    where: { id: 'bill-1' },
    update: {},
    create: {
      id: 'bill-1',
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
  console.log('  ✓ Sample bill created');

  // ── Sample Complaint ─────────────────────────────────────
  const slaDueAt = new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours for MEDIUM

  await prisma.complaint.upsert({
    where: { id: 'complaint-1' },
    update: {},
    create: {
      id: 'complaint-1',
      unitId: 'unit-a101',
      societyId: society.id,
      createdByUserId: owner.id,
      category: 'PLUMBING',
      description: 'Water leakage in the kitchen pipe near the sink. Dripping constantly.',
      photoUrls: [],
      priority: 'MEDIUM',
      status: 'OPEN',
      slaDueAt,
    },
  });
  console.log('  ✓ Sample complaint created');

  // ── Sample Notice ────────────────────────────────────────
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
  console.log('  ✓ Sample notice created');

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
