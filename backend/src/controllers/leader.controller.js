// src/controllers/leader.controller.js
const prisma = require('../utils/prisma');
const { createAuditLog } = require('../services/audit.service');

// GET /api/leader/patrol — ข้อมูลหมู่ของตัวเอง
const getMyPatrol = async (req, res, next) => {
  try {
    const patrol = await prisma.patrol.findUnique({
      where: { id: req.user.patrolLeader.id },
      include: {
        troop: { include: { camp: true } },
        scouts: {
          include: {
            attendances: { include: { schedule: { include: { activity: true } } } },
          },
        },
      },
    });

    if (!patrol) return res.status(404).json({ error: 'ไม่พบข้อมูลหมู่' });

    const allActivities = await prisma.activity.findMany({ where: { isActive: true } });
    const mainTotal = allActivities.filter(a => a.type === 'MAIN').length;
    const specialTotal = allActivities.filter(a => a.type === 'SPECIAL').length;
    const freeTotal = allActivities.filter(a => a.type === 'FREE').length;

    const scoutsWithProgress = patrol.scouts.map(scout => {
      const passed = scout.attendances.filter(a => a.status === 'PASSED');
      return {
        ...scout,
        progress: {
          main: { done: passed.filter(a => a.schedule.activity.type === 'MAIN').length, total: mainTotal },
          special: { done: passed.filter(a => a.schedule.activity.type === 'SPECIAL').length, total: specialTotal },
          free: { done: passed.filter(a => a.schedule.activity.type === 'FREE').length, total: freeTotal },
        },
      };
    });

    res.json({ ...patrol, scouts: scoutsWithProgress });
  } catch (err) {
    next(err);
  }
};

// GET /api/leader/scouts/:id — ดูรายละเอียดลูกเสือ
const getScout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patrolId = req.user.patrolLeader?.id;

    const scout = await prisma.scout.findFirst({
      where: { id, patrolId },
      include: {
        patrol: { include: { troop: true } },
        attendances: { include: { schedule: { include: { activity: true } } } },
      },
    });

    if (!scout) return res.status(404).json({ error: 'ไม่พบลูกเสือหรือไม่มีสิทธิ์' });

    res.json(scout);
  } catch (err) {
    next(err);
  }
};

// GET /api/leader/available-scouts — ดูรายชื่อลูกเสือที่ยังไม่มีหมู่และมาจากสถานศึกษาเดียวกัน
const getAvailableScouts = async (req, res, next) => {
  try {
    const patrolId = req.user.patrolLeader?.id;
    
    // ดูข้อมูลหมู่ของตัวเองเพื่อรู้ว่ามาจากสถานศึกษาอะไร
    const patrol = await prisma.patrol.findUnique({
      where: { id: patrolId },
      include: { 
        scouts: { take: 1 }, // เอาแค่ 1 คนเพื่อดูสถานศึกษา
        troop: { include: { camp: true } }
      }
    });

    if (!patrol) return res.status(404).json({ error: 'ไม่พบข้อมูลหมู่' });

    // หาสถานศึกษาของหมู่
    const patrolSchool = patrol.scouts.length > 0 ? patrol.scouts[0].school : null;

    // ดูจำนวนสมาชิกปัจจุบัน
    const currentCount = await prisma.scout.count({ where: { patrolId } });

    // หาลูกเสือที่ยังไม่มีหมู่และมาจากสถานศึกษาเดียวกัน
    const availableScouts = await prisma.scout.findMany({
      where: {
        patrolId: null,
        ...(patrolSchool ? { school: patrolSchool } : {})
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        scoutCode: true,
        school: true,
        province: true
      },
      orderBy: { firstName: 'asc' }
    });

    res.json({
      scouts: availableScouts,
      currentCount,
      maxCount: 8,
      canAdd: currentCount < 8,
      school: patrolSchool
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/leader/add-scout — เพิ่มลูกเสือเข้าหมู่
const addScoutToPatrol = async (req, res, next) => {
  try {
    const { scoutId } = req.body;
    const patrolId = req.user.patrolLeader?.id;

    // ตรวจสอบว่าหมู่เต็มหรือยัง
    const currentCount = await prisma.scout.count({ where: { patrolId } });
    if (currentCount >= 8) {
      return res.status(400).json({ error: 'หมู่เต็ม (8 คนแล้ว)' });
    }

    // ตรวจสอบว่าลูกเสือมีอยู่จริงและยังไม่มีหมู่
    const scout = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: { patrol: true }
    });

    if (!scout) {
      return res.status(404).json({ error: 'ไม่พบลูกเสือ' });
    }

    if (scout.patrolId) {
      return res.status(400).json({ error: 'ลูกเสือคนนี้มีหมู่แล้ว' });
    }

    // ตรวจสอบว่ามาจากสถานศึกษาเดียวกัน
    const patrol = await prisma.patrol.findUnique({
      where: { id: patrolId },
      include: { scouts: { take: 1 } }
    });

    const patrolSchool = patrol.scouts.length > 0 ? patrol.scouts[0].school : null;
    
    if (patrolSchool && scout.school !== patrolSchool) {
      return res.status(400).json({ error: 'ลูกเสือต้องมาจากสถานศึกษาเดียวกัน' });
    }

    // เพิ่มลูกเสือเข้าหมู่
    const updated = await prisma.scout.update({
      where: { id: scoutId },
      data: { patrolId }
    });

    await createAuditLog({
      accountId: req.user.id,
      scoutId: scoutId,
      action: 'ASSIGN_PATROL',
      entity: 'Scout',
      entityId: scoutId,
      oldValue: { patrolId: null },
      newValue: { patrolId },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leader/scouts/:id — แก้ไขข้อมูลส่วนตัว
const updateScout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patrolId = req.user.patrolLeader?.id;

    const existing = await prisma.scout.findFirst({ where: { id, patrolId } });
    if (!existing) return res.status(404).json({ error: 'ไม่พบลูกเสือหรือไม่มีสิทธิ์' });

    const { firstName, lastName, nickname, birthDate, school, province, phone, email } = req.body;

    const updated = await prisma.scout.update({
      where: { id },
      data: { firstName, lastName, nickname, birthDate: birthDate ? new Date(birthDate) : undefined, school, province, phone, email },
    });

    await createAuditLog({
      accountId: req.user.id,
      scoutId: id,
      action: 'UPDATE',
      entity: 'Scout',
      entityId: id,
      oldValue: { firstName: existing.firstName, lastName: existing.lastName, phone: existing.phone },
      newValue: { firstName, lastName, phone },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyPatrol, getScout, getAvailableScouts, addScoutToPatrol, updateScout };
