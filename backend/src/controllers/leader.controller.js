// src/controllers/leader.controller.js
const prisma = require('../utils/prisma');
const { createAuditLog } = require('../services/audit.service');

// GET /api/leader/patrol
const getMyPatrol = async (req, res, next) => {
  try {
    // ✅ เปลี่ยนจาก leadingSquad?.id เป็น leadingSquads?.[0]?.id
    const squad = await prisma.squad.findUnique({
      where: { id: req.user.leadingSquads?.[0]?.id },
      include: {
        troop: { include: { camp: true } },
        scouts: {
          include: {
            attendances: { include: { schedule: { include: { activity: true } } } },
          },
        },
      },
    });

    if (!squad) return res.status(404).json({ error: 'ไม่พบข้อมูลหมู่' });

    const allActivities = await prisma.activity.findMany({ where: { isActive: true } });
    const mainTotal = allActivities.filter(a => a.type === 'MAIN').length;
    const specialTotal = allActivities.filter(a => a.type === 'SPECIAL').length;
    const freeTotal = allActivities.filter(a => a.type === 'FREE').length;

    const scoutsWithProgress = squad.scouts.map(scout => {
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

    res.json({ ...squad, scouts: scoutsWithProgress });
  } catch (err) {
    next(err);
  }
};

// GET /api/leader/scouts/:id
const getScout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const squadId = req.user.leadingSquads?.[0]?.id;  // ✅

    const scout = await prisma.scout.findFirst({
      where: { id, squadId },
      include: {
        squad: { include: { troop: true } },
        attendances: { include: { schedule: { include: { activity: true } } } },
      },
    });

    if (!scout) return res.status(404).json({ error: 'ไม่พบลูกเสือหรือไม่มีสิทธิ์' });

    res.json(scout);
  } catch (err) {
    next(err);
  }
};

// GET /api/leader/available-scouts
const getAvailableScouts = async (req, res, next) => {
  try {
    const squadId = req.user.leadingSquads?.[0]?.id;  // ✅

    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        scouts: { take: 1 },
        troop: { include: { camp: true } }
      }
    });

    if (!squad) return res.status(404).json({ error: 'ไม่พบข้อมูลหมู่' });

    const squadSchool = squad.scouts.length > 0 ? squad.scouts[0].school : null;
    const currentCount = await prisma.scout.count({ where: { squadId } });

    const availableScouts = await prisma.scout.findMany({
      where: {
        squadId: null,
        ...(squadSchool ? { school: squadSchool } : {})
      },
      select: {
        id: true, firstName: true, lastName: true,
        scoutCode: true, school: true, province: true
      },
      orderBy: { firstName: 'asc' }
    });

    res.json({
      scouts: availableScouts,
      currentCount,
      maxCount: 8,
      canAdd: currentCount < 8,
      school: squadSchool
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/leader/add-scout
const addScoutToPatrol = async (req, res, next) => {
  try {
    const { scoutId } = req.body;
    const squadId = req.user.leadingSquads?.[0]?.id;  // ✅

    const currentCount = await prisma.scout.count({ where: { squadId } });
    if (currentCount >= 8) {
      return res.status(400).json({ error: 'หมู่เต็ม (8 คนแล้ว)' });
    }

    const scout = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: { squad: true }
    });

    if (!scout) return res.status(404).json({ error: 'ไม่พบลูกเสือ' });
    if (scout.squadId) return res.status(400).json({ error: 'ลูกเสือคนนี้มีหมู่แล้ว' });

    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: { scouts: { take: 1 } }
    });

    const squadSchool = squad.scouts.length > 0 ? squad.scouts[0].school : null;
    if (squadSchool && scout.school !== squadSchool) {
      return res.status(400).json({ error: 'ลูกเสือต้องมาจากสถานศึกษาเดียวกัน' });
    }

    const updated = await prisma.scout.update({
      where: { id: scoutId },
      data: { squadId }
    });

    await createAuditLog({
      accountId: req.user.id,
      scoutId: scoutId,
      action: 'ASSIGN_PATROL',
      entity: 'Scout',
      entityId: scoutId,
      oldValue: { squadId: null },
      newValue: { squadId },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leader/scouts/:id
const updateScout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const squadId = req.user.leadingSquads?.[0]?.id;  // ✅

    const existing = await prisma.scout.findFirst({ where: { id, squadId } });
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

// GET /api/leader/profile
const getProfile = async (req, res, next) => {
  try {
    const leader = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, username: true, role: true, name: true,
        firstName: true, lastName: true, phone: true,
        email: true, school: true, prefix: true,
        leadingSquads: {  // ✅
          include: {
            troop: { include: { camp: true } }
          }
        }
      }
    });

    if (!leader) return res.status(404).json({ error: 'ไม่พบข้อมูลผู้กำกับ' });

    res.json(leader);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/leader/profile
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, email, school, prefix, province } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone, email, school, prefix, province },
      select: {
        id: true, username: true, role: true, name: true,
        firstName: true, lastName: true, phone: true,
        email: true, school: true, prefix: true, province: true,
        leadingSquads: {  // ✅
          include: {
            troop: { include: { camp: true } }
          }
        }
      }
    });

    await createAuditLog({
      accountId: req.user.id,
      action: 'UPDATE_LEADER_PROFILE',
      entity: 'User',
      entityId: req.user.id,
      oldValue: { firstName: req.user.firstName, lastName: req.user.lastName, phone: req.user.phone },
      newValue: { firstName, lastName, phone },
      ipAddress: req.ip,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyPatrol, getScout, getAvailableScouts, addScoutToPatrol, updateScout, getProfile, updateProfile };