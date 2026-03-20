const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting to seed comprehensive sample data...');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.scout.deleteMany();
  await prisma.user.deleteMany();
  await prisma.activityGroup.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.troop.deleteMany();
  await prisma.camp.deleteMany();

  // Create Camps
  console.log('🏕️ Creating camps...');
  const camps = await Promise.all([
    prisma.camp.create({
      data: { name: 'ค่ายลูกเสืออาชีวศึกษา 2567' }
    }),
    prisma.camp.create({
      data: { name: 'ค่ายลูกเสือสืบสาน 2567' }
    })
  ]);

  // Create Troops
  console.log('🏰 Creating troops...');
  const troops = await Promise.all([
    prisma.troop.create({
      data: { name: 'หมู่ที่ 1', number: 1, campId: camps[0].id }
    }),
    prisma.troop.create({
      data: { name: 'หมู่ที่ 2', number: 2, campId: camps[0].id }
    }),
    prisma.troop.create({
      data: { name: 'หมู่ที่ 3', number: 3, campId: camps[1].id }
    })
  ]);

  // Create Squads
  console.log('👥 Creating squads...');
  const squads = await Promise.all([
    prisma.squad.create({
      data: { name: 'กระทิง', number: 1, troopId: troops[0].id }
    }),
    prisma.squad.create({
      data: { name: 'เสือ', number: 2, troopId: troops[0].id }
    }),
    prisma.squad.create({
      data: { name: 'ช้าง', number: 1, troopId: troops[1].id }
    }),
    prisma.squad.create({
      data: { name: 'ม้า', number: 2, troopId: troops[1].id }
    }),
    prisma.squad.create({
      data: { name: 'ควาย', number: 1, troopId: troops[2].id }
    })
  ]);

  // Create Activities
  console.log('🎯 Creating activities...');
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        name: 'ประกอบอาหาร',
        type: 'SKILL',
        description: 'การเรียนรู้การประกอบอาหารในป่า',
        maxScans: 50
      }
    }),
    prisma.activity.create({
      data: {
        name: 'เดินป่า',
        type: 'OUTDOOR',
        description: 'การเดินป่าและการใช้เข็มทิศ',
        maxScans: 30
      }
    }),
    prisma.activity.create({
      data: {
        name: 'ช่วยเหลือปฐมพยาบาล',
        type: 'FIRST_AID',
        description: 'การปฐมพยาบาลเบื้องต้น',
        maxScans: 40
      }
    }),
    prisma.activity.create({
      data: {
        name: 'สร้างที่พักชั่วคราว',
        type: 'SURVIVAL',
        description: 'การสร้างที่พักในป่า',
        maxScans: 25
      }
    }),
    prisma.activity.create({
      data: {
        name: 'การเชือดป่า',
        type: 'KNOTS',
        description: 'การเรียนรู้เชือดป่าชนิดต่างๆ',
        maxScans: 35
      }
    })
  ]);

  // Create Activity Groups
  console.log('📁 Creating activity groups...');
  const activityGroups = await Promise.all([
    prisma.activityGroup.create({
      data: {
        name: 'กลุ่มทักษะชีวิต',
        description: 'กิจกรรมที่เน้นทักษะการอยู่รอด',
        campId: camps[0].id,
        maxScouts: 100
      }
    }),
    prisma.activityGroup.create({
      data: {
        name: 'กลุ่มกิจกรรมกลางแจ้ง',
        description: 'กิจกรรมกลางแจ้งและผจญภัย',
        campId: camps[0].id,
        maxScouts: 80
      }
    })
  ]);

  // Assign activity groups to squads
  await Promise.all([
    prisma.squad.update({
      where: { id: squads[0].id },
      data: { activityGroupId: activityGroups[0].id }
    }),
    prisma.squad.update({
      where: { id: squads[1].id },
      data: { activityGroupId: activityGroups[1].id }
    })
  ]);

  // Create Camp Managers (ผู้ดูแลค่าย)
  console.log('🏕️ Creating camp managers...');
  const campManagers = [
    {
      username: 'campmanager1',
      password: 'camp123',
      role: 'CAMP_MANAGER',
      name: 'วิทัตต ดูแลค่าย',
      firstName: 'วิทัตต',
      lastName: 'ดูแลค่าย',
      phone: '0867890123',
      email: 'campmanager1@example.com',
      school: 'สำนักงานค่ายลูกเสือ',
      campId: camps[0].id
    },
    {
      username: 'campmanager2',
      password: 'camp123',
      role: 'CAMP_MANAGER',
      name: 'สุภาพร ดูแลค่าย',
      firstName: 'สุภาพร',
      lastName: 'ดูแลค่าย',
      phone: '0878901234',
      email: 'campmanager2@example.com',
      school: 'สำนักงานค่ายลูกเสือ',
      campId: camps[1].id
    }
  ];

  const createdCampManagers = [];
  for (const campManager of campManagers) {
    const hashedPassword = await bcrypt.hash(campManager.password, 10);
    const user = await prisma.user.create({
      data: {
        ...campManager,
        password: hashedPassword
      }
    });
    createdCampManagers.push(user);
  }

  // Create Directors (TROOP_LEADER)
  console.log('👨‍🏫 Creating directors...');
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
      campId: camps[0].id
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
      campId: camps[0].id
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
      campId: camps[1].id
    }
  ];

  const createdDirectors = [];
  for (const director of directors) {
    const hashedPassword = await bcrypt.hash(director.password, 10);
    const user = await prisma.user.create({
      data: {
        ...director,
        password: hashedPassword
      }
    });
    createdDirectors.push(user);
  }

  // Assign leaders to squads
  await Promise.all([
    prisma.squad.update({
      where: { id: squads[0].id },
      data: { leaderId: createdDirectors[0].id }
    }),
    prisma.squad.update({
      where: { id: squads[1].id },
      data: { leaderId: createdDirectors[1].id }
    }),
    prisma.squad.update({
      where: { id: squads[2].id },
      data: { leaderId: createdDirectors[2].id }
    })
  ]);

  // Create Staff users
  console.log('👷 Creating staff...');
  const staffUsers = [
    {
      username: 'staff1',
      password: 'staff123',
      role: 'STAFF',
      name: 'ประสิทธิ์ รักงาน',
      firstName: 'ประสิทธิ์',
      lastName: 'รักงาน',
      phone: '0845678901',
      email: 'prasit@example.com',
      campId: camps[0].id
    },
    {
      username: 'staff2',
      password: 'staff123',
      role: 'STAFF',
      name: 'สมหญิง ใจดี',
      firstName: 'สมหญิง',
      lastName: 'ใจดี',
      phone: '0856789012',
      email: 'somying@example.com',
      campId: camps[1].id
    }
  ];

  const createdStaff = [];
  for (const staff of staffUsers) {
    const hashedPassword = await bcrypt.hash(staff.password, 10);
    const user = await prisma.user.create({
      data: {
        ...staff,
        password: hashedPassword
      }
    });
    createdStaff.push(user);
  }

  // Assign staff to activities
  await Promise.all([
    prisma.activity.update({
      where: { id: activities[0].id },
      data: { staffId: createdStaff[0].id }
    }),
    prisma.activity.update({
      where: { id: activities[1].id },
      data: { staffId: createdStaff[1].id }
    })
  ]);

  // Create Admin user
  console.log('👑 Creating admin...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
      name: 'ผู้ดูแลระบบ',
      firstName: 'ผู้ดูแล',
      lastName: 'ระบบ',
      email: 'admin@example.com',
      campId: camps[0].id
    }
  });

  // Create Scouts
  console.log('🏕️ Creating scouts...');
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
      allergies: 'แพ้ถั่ว แพ้หอย',
      congenitalDisease: 'โรคหอบหืด',
      campId: camps[0].id,
      squadId: squads[0].id
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
      campId: camps[0].id,
      squadId: squads[0].id
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
      campId: camps[0].id,
      squadId: squads[1].id
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
      campId: camps[0].id,
      squadId: squads[1].id
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
      campId: camps[1].id,
      squadId: squads[2].id
    },
    {
      username: 'scout006',
      password: 'scout123',
      role: 'SCOUT',
      name: 'ด.ช. อนุชิต มีความสุข',
      firstName: 'อนุชิต',
      lastName: 'มีความสุข',
      nickname: 'ชิต',
      phone: '0896789012',
      email: 'anuchit@example.com',
      school: 'โรงเรียนดรุณี',
      province: 'สุราษฎร์ธานี',
      birthDate: '2009-01-30',
      allergies: 'แพ้ฝุ่น แพ้ละอองฝอย',
      congenitalDisease: 'โรคหืด',
      campId: camps[1].id,
      squadId: squads[2].id
    },
    {
      username: 'scout007',
      password: 'scout123',
      role: 'SCOUT',
      name: 'ด.ญ. นภาพร ใสสุข',
      firstName: 'นภาพร',
      lastName: 'ใสสุข',
      nickname: 'พร',
      phone: '0897890123',
      email: 'naphaporn@example.com',
      school: 'โรงเรียนสตรีวรนาถ',
      province: 'พิษณุโลก',
      birthDate: '2008-11-08',
      allergies: 'ไม่มี',
      congenitalDisease: 'โรคหัวใจ',
      campId: camps[1].id,
      squadId: squads[3].id
    },
    {
      username: 'scout008',
      password: 'scout123',
      role: 'SCOUT',
      name: 'ด.ช. ธีรพงษ์ แข็งแกร่ง',
      firstName: 'ธีรพงษ์',
      lastName: 'แข็งแกร่ง',
      nickname: 'ธีร์',
      phone: '0898901234',
      email: 'teerapong@example.com',
      school: 'โรงเรียนบดินทรเดชา',
      province: 'สงขลา',
      birthDate: '2009-06-12',
      allergies: 'แพ้น้ำแข็ง',
      congenitalDisease: 'ไม่มี',
      campId: camps[0].id,
      squadId: squads[3].id
    }
  ];

  const createdScouts = [];
  for (const scoutData of scouts) {
    const hashedPassword = await bcrypt.hash(scoutData.password, 10);
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

    const scoutCode = `SC${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    const scout = await prisma.scout.create({
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
        squadId: scoutData.squadId,
        userId: user.id
      }
    });
    createdScouts.push(scout);
  }

  // Create Schedules
  console.log('📅 Creating schedules...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const schedules = [
    // Day 1 - Morning
    {
      activityId: activities[0].id, // ประกอบอาหาร
      campId: camps[0].id,
      squadId: squads[0].id,
      date: today,
      slot: 'MORNING'
    },
    {
      activityId: activities[1].id, // เดินป่า
      campId: camps[0].id,
      squadId: squads[1].id,
      date: today,
      slot: 'MORNING'
    },
    // Day 1 - Afternoon
    {
      activityId: activities[2].id, // ปฐมพยาบาล
      campId: camps[0].id,
      squadId: squads[0].id,
      date: today,
      slot: 'AFTERNOON'
    },
    {
      activityId: activities[3].id, // สร้างที่พัก
      campId: camps[0].id,
      squadId: squads[1].id,
      date: today,
      slot: 'AFTERNOON'
    },
    // Day 2 - Morning
    {
      activityId: activities[4].id, // การเชือดป่า
      campId: camps[1].id,
      squadId: squads[2].id,
      date: tomorrow,
      slot: 'MORNING'
    },
    {
      activityId: activities[0].id, // ประกอบอาหาร
      campId: camps[1].id,
      squadId: squads[3].id,
      date: tomorrow,
      slot: 'MORNING'
    },
    // Day 2 - Afternoon
    {
      activityId: activities[1].id, // เดินป่า
      campId: camps[1].id,
      squadId: squads[2].id,
      date: tomorrow,
      slot: 'AFTERNOON'
    },
    {
      activityId: activities[2].id, // ปฐมพยาบาล
      campId: camps[1].id,
      squadId: squads[3].id,
      date: tomorrow,
      slot: 'AFTERNOON'
    }
  ];

  await Promise.all(
    schedules.map(schedule => 
      prisma.schedule.create({ data: schedule })
    )
  );

  // Create Attendances
  console.log('✅ Creating attendances...');
  const attendances = [
    // Scout 1 attendances
    {
      scoutId: createdScouts[0].id,
      activityId: activities[0].id,
      result: 'PASS',
      scannedBy: createdStaff[0].id,
      scannedAt: new Date()
    },
    {
      scoutId: createdScouts[0].id,
      activityId: activities[2].id,
      result: 'PASS',
      scannedBy: createdStaff[1].id,
      scannedAt: new Date()
    },
    // Scout 2 attendances
    {
      scoutId: createdScouts[1].id,
      activityId: activities[0].id,
      result: 'PASS',
      scannedBy: createdStaff[0].id,
      scannedAt: new Date()
    },
    {
      scoutId: createdScouts[1].id,
      activityId: activities[2].id,
      result: 'FAIL',
      scannedBy: createdStaff[1].id,
      scannedAt: new Date()
    },
    // Scout 3 attendances
    {
      scoutId: createdScouts[2].id,
      activityId: activities[1].id,
      result: 'PASS',
      scannedBy: createdStaff[1].id,
      scannedAt: new Date()
    },
    {
      scoutId: createdScouts[2].id,
      activityId: activities[3].id,
      result: 'PASS',
      scannedBy: createdStaff[0].id,
      scannedAt: new Date()
    },
    // Scout 4 attendances
    {
      scoutId: createdScouts[3].id,
      activityId: activities[1].id,
      result: 'PASS',
      scannedBy: createdStaff[1].id,
      scannedAt: new Date()
    },
    {
      scoutId: createdScouts[3].id,
      activityId: activities[3].id,
      result: 'PASS',
      scannedBy: createdStaff[0].id,
      scannedAt: new Date()
    }
  ];

  await Promise.all(
    attendances.map(attendance => 
      prisma.attendance.create({ data: attendance })
    )
  );

  // Create Audit Logs
  console.log('📝 Creating audit logs...');
  const auditLogs = [
    {
      userId: admin.id,
      action: 'CREATE',
      target: 'User',
      before: null,
      after: JSON.stringify({ username: 'scout001', role: 'SCOUT' })
    },
    {
      userId: admin.id,
      action: 'CREATE',
      target: 'Activity',
      before: null,
      after: JSON.stringify({ name: 'ประกอบอาหาร', type: 'SKILL' })
    },
    {
      userId: createdDirectors[0].id,
      action: 'UPDATE',
      target: 'Squad',
      before: JSON.stringify({ name: 'กระทิง', leaderId: null }),
      after: JSON.stringify({ name: 'กระทิง', leaderId: createdDirectors[0].id })
    },
    {
      userId: createdStaff[0].id,
      action: 'SCAN',
      target: 'Attendance',
      before: null,
      after: JSON.stringify({ scoutId: createdScouts[0].id, activityId: activities[0].id })
    }
  ];

  await Promise.all(
    auditLogs.map(log => 
      prisma.auditLog.create({ data: log })
    )
  );

  console.log('🎉 Comprehensive sample data creation completed!');
  console.log('\n📋 Login Credentials:');
  console.log('Admin:');
  console.log('  - admin: admin123');
  console.log('Camp Managers:');
  campManagers.forEach(cm => {
    console.log(`  - ${cm.username}: ${cm.password}`);
  });
  console.log('Directors:');
  directors.forEach(d => {
    console.log(`  - ${d.username}: ${d.password}`);
  });
  console.log('Staff:');
  staffUsers.forEach(s => {
    console.log(`  - ${s.username}: ${s.password}`);
  });
  console.log('Scouts:');
  scouts.forEach(s => {
    console.log(`  - ${s.username}: ${s.password}`);
  });

  console.log('\n📊 Summary:');
  console.log(`- Camps: ${camps.length}`);
  console.log(`- Troops: ${troops.length}`);
  console.log(`- Squads: ${squads.length}`);
  console.log(`- Activities: ${activities.length}`);
  console.log(`- Activity Groups: ${activityGroups.length}`);
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Scouts: ${createdScouts.length}`);
  console.log(`- Schedules: ${schedules.length}`);
  console.log(`- Attendances: ${attendances.length}`);
  console.log(`- Audit Logs: ${auditLogs.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
