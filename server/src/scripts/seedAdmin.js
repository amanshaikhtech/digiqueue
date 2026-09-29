require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

async function seed() {
  console.log('--- DigiQueue Database Seeding Started ---');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@digiqueue.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

  // 1. Seed or update Admin User
  const adminSalt = await bcrypt.genSalt(12);
  const adminPasswordHash = await bcrypt.hash(adminPassword, adminSalt);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: 'admin',
      isActive: true,
      clinicId: null,
    },
    create: {
      name: 'Hospital System Admin',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'admin',
      clinicId: null,
      isActive: true,
    },
  });
  console.log(`[Seed] Admin user ready: ${adminUser.email} (ID: ${adminUser.id})`);

  // 2. Seed Default Clinic
  let clinic = await prisma.clinic.findFirst({
    where: { name: "Sunshine Children's Clinic" },
  });

  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: "Sunshine Children's Clinic",
        address: '402 Hope Avenue, Pediatric Wing, Metro City',
      },
    });
    console.log(`[Seed] Clinic created: ${clinic.name} (ID: ${clinic.id})`);
  } else {
    console.log(`[Seed] Clinic exists: ${clinic.name} (ID: ${clinic.id})`);
  }

  // 3. Seed Default Doctor
  let doctor = await prisma.doctor.findFirst({
    where: { name: 'Dr. Maya Lin', clinicId: clinic.id },
  });

  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        clinicId: clinic.id,
        name: 'Dr. Maya Lin',
        specialization: 'Pediatric General Medicine',
        isActive: true,
      },
    });
    console.log(`[Seed] Doctor created: ${doctor.name} (ID: ${doctor.id})`);
  } else {
    console.log(`[Seed] Doctor exists: ${doctor.name} (ID: ${doctor.id})`);
  }

  // 4. Seed Default Supervisor
  const supervisorEmail = 'supervisor@digiqueue.local';
  const supervisorPassword = 'SupervisorPassword123!';
  const supervisorSalt = await bcrypt.genSalt(12);
  const supervisorPasswordHash = await bcrypt.hash(supervisorPassword, supervisorSalt);

  const supervisorUser = await prisma.user.upsert({
    where: { email: supervisorEmail },
    update: {
      passwordHash: supervisorPasswordHash,
      role: 'supervisor',
      clinicId: clinic.id,
      isActive: true,
    },
    create: {
      name: 'Sarah Jenkins (Supervisor)',
      email: supervisorEmail,
      passwordHash: supervisorPasswordHash,
      role: 'supervisor',
      clinicId: clinic.id,
      isActive: true,
    },
  });
  console.log(`[Seed] Supervisor ready: ${supervisorUser.email} (ID: ${supervisorUser.id})`);

  // 5. Ensure an Open Session exists for Dr. Maya Lin
  let openSession = await prisma.session.findFirst({
    where: {
      doctorId: doctor.id,
      endedAt: null,
    },
  });

  if (!openSession) {
    openSession = await prisma.session.create({
      data: {
        doctorId: doctor.id,
        startedBy: supervisorUser.id,
        currentTokenCount: 0,
      },
    });
    console.log(`[Seed] Open session created for Dr. Maya Lin (ID: ${openSession.id})`);
  } else {
    console.log(`[Seed] Active open session found for Dr. Maya Lin (ID: ${openSession.id})`);
  }

  console.log('\n--- Seeding Summary ---');
  console.log(`Admin Login: ${adminEmail} | ${adminPassword}`);
  console.log(`Supervisor Login: ${supervisorEmail} | ${supervisorPassword}`);
  console.log(`Clinic ID: ${clinic.id}`);
  console.log(`Doctor ID: ${doctor.id}`);
  console.log(`Active Session ID: ${openSession.id}`);
  console.log('------------------------\n');
}

seed()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
