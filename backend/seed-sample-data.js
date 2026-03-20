const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed sample data...');

  // Create or get a camp
  let camp = await prisma.camp.findFirst();
  if (!camp) {
    camp = await prisma.camp.create({
      data: {
        name: 'ค่ายลูกเสืออาชีวศึกษา 2567',
      }
    });
    console.log('✅ Created camp:', camp.name);
  }

  // Create sample directors (TROOP_LEADER)
  const directors = [
    {
      username: 'director1',
      password: 'password123',
      role: 'TROOP_LEADER',
      name: 'สมชาย ใจดี',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
      phone: '0812345678',
      email: 'somchai@example.com',
      school: 'โรงเรียนสาธิตมหาวิทยาลัย',
      prefix: 'นาย',
      campId: camp.id
    },
    {
      username: 'director2',
      password: 'password123',
      role: 'TROOP_LEADER',
      name: 'สมศรี รักดี',
      firstName: 'สมศรี',
      lastName: 'รักดี',
      phone: '0823456789',
      email: 'somsri@example.com',
      school: 'โรงเรียนวัดดอนเจดีย์',
      prefix: 'นางสาว',
      campId: camp.id
    },
    {
      username: 'director3',
      password: 'password123',
      role: 'TROOP_LEADER',
      name: 'วิรัตน์ มีกำลัง',
      firstName: 'วิรัตน์',
      lastName: 'มีกำลัง',
      phone: '0834567890',
      email: 'virat@example.com',
      school: 'โรงเรียนเตรียมอุดมศึกษา',
      prefix: 'นาย',
      campId: camp.id
    }
  ];

  console.log('👥 Creating directors...');
  for (const director of directors) {
    const hashedPassword = await bcrypt.hash(director.password, 10);
    const existingUser = await prisma.user.findUnique({
      where: { username: director.username }
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          ...director,
          password: hashedPassword
        }
      });
      console.log(`✅ Created director: ${user.name} (${user.username})`);
    } else {
      console.log(`⚠️  Director ${director.username} already exists`);
    }
  }

  // Create sample scouts
  const scouts = [
    {
      username: 'scout001',
      password: 'scout123',
      role: 'SCOUT',
      name: 'นาย สมศักดิ์ รุ่งเรือง',
      firstName: 'สมศักดิ์',
      lastName: 'รุ่งเรือง',
      nickname: 'บอย',
      phone: '0891234567',
      email: 'somsak@example.com',
      school: 'โรงเรียนสาธิตมหาวิทยาลัย',
      province: 'กรุงเทพมหานคร',
      birthDate: '2008-05-15',
      allergies: 'แพ้ถั่ว แพะหอย',
      congenitalDisease: 'โรคหอบหืด',
      campId: camp.id
    },
    {
      username: 'scout002',
      password: 'scout123',
      role: 'SCOUT',
      name: 'นางสาว มานี มีใจ',
      firstName: 'มานี',
      lastName: 'มีใจ',
      nickname: 'นิด',
      phone: '0892345678',
      email: 'manee@example.com',
      school: 'โรงเรียนวัดดอนเจดีย์',
      province: 'นนทบุรี',
      birthDate: '2009-08-22',
      allergies: 'แพ้ยาปฏิชีวนะ',
      congenitalDisease: 'ไม่มี',
      campId: camp.id
    },
    {
      username: 'scout003',
      password: 'scout123',
      role: 'SCOUT',
      name: 'ด.ช. วิษณุ แข็งแกร่ง',
      firstName: 'วิษณุ',
      lastName: 'แข็งแกร่ง',
      nickname: 'น็อต',
      phone: '0893456789',
      email: 'visanu@example.com',
      school: 'โรงเรียนเตรียมอุดมศึกษา',
      province: 'กรุงเทพมหานคร',
      birthDate: '2008-12-10',
      allergies: 'ไม่มี',
      congenitalDisease: 'โรคเบาหวาน',
      campId: camp.id
    },
    {
      username: 'scout004',
      password: 'scout123',
      role: 'SCOUT',
      name: 'ด.ญ. สายชล ใส่ใจ',
      firstName: 'สายชล',
      lastName: 'ใส่ใจ',
      nickname: 'ชล',
      phone: '0894567890',
      email: 'saichon@example.com',
      school: 'โรงเรียนสตรีวิทยา',
      province: 'เชียงใหม่',
      birthDate: '2009-03-25',
      allergies: 'แพ้ผงซักฟอก แพ้แป้ง',
      congenitalDisease: 'โรคภูมิแพ้',
      campId: camp.id
    },
    {
      username: 'scout005',
      password: 'scout123',
      role: 'SCOUT',
      name: 'ด.ช. กิตติศักดิ์ มุ่งมั่น',
      firstName: 'กิตติศักดิ์',
      lastName: 'มุ่งมั่น',
      nickname: 'กิต',
      phone: '0895678901',
      email: 'kittisak@example.com',
      school: 'โรงเรียนวิทยาศาสตร์',
      province: 'ขอนแก่น',
      birthDate: '2008-07-18',
      allergies: 'แพ้อาหารทะเล',
      congenitalDisease: 'ไม่มี',
      campId: camp.id
    }
  ];

  console.log('🏕️ Creating scouts...');
  for (const scoutData of scouts) {
    const hashedPassword = await bcrypt.hash(scoutData.password, 10);
    const existingUser = await prisma.user.findUnique({
      where: { username: scoutData.username }
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: {
          username: scoutData.username,
          password: hashedPassword,
          role: scoutData.role,
          name: scoutData.name,
          firstName: scoutData.firstName,
          lastName: scoutData.lastName,
          phone: scoutData.phone,
          email: scoutData.email,
          school: scoutData.school,
          campId: scoutData.campId
        }
      });

      // Create corresponding scout record
      const scoutCode = `SC${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
      await prisma.scout.create({
        data: {
          scoutCode,
          firstName: scoutData.firstName,
          lastName: scoutData.lastName,
          nickname: scoutData.nickname,
          school: scoutData.school,
          province: scoutData.province,
          phone: scoutData.phone,
          email: scoutData.email,
          birthDate: scoutData.birthDate ? new Date(scoutData.birthDate) : null,
          allergies: scoutData.allergies,
          congenitalDisease: scoutData.congenitalDisease,
          userId: user.id
        }
      });

      console.log(`✅ Created scout: ${user.name} (${user.username}) - Scout Code: ${scoutCode}`);
    } else {
      console.log(`⚠️  Scout ${scoutData.username} already exists`);
    }
  }

  console.log('🎉 Sample data creation completed!');
  console.log('\n📋 Login Credentials:');
  console.log('Directors:');
  directors.forEach(d => {
    console.log(`  - ${d.username}: ${d.password}`);
  });
  console.log('Scouts:');
  scouts.forEach(s => {
    console.log(`  - ${s.username}: ${s.password}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
