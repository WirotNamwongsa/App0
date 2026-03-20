// src/controllers/camp.controller.js
const prisma = require('../utils/prisma');
const { createAuditLog } = require('../services/audit.service');
const { v4: uuidv4 } = require('uuid');

const getCampId = (req) => req.user.campId;

// GET /api/camp/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const camp = await prisma.camp.findUnique({
      where: { id: campId },
      include: {
        troops: {
          include: {
            patrols: { include: { scouts: { include: { attendances: true } } } },
          },
        },
      },
    });

    const allActivities = await prisma.activity.findMany({ where: { isActive: true } });
    const totals = { main: allActivities.filter(a => a.type === 'MAIN').length, special: allActivities.filter(a => a.type === 'SPECIAL').length, free: allActivities.filter(a => a.type === 'FREE').length };

    let totalScouts = 0, mainDone = 0, specialDone = 0, freeDone = 0, awardCount = 0;

    const troopsData = camp.troops.map(troop => {
      let troopScouts = 0, troopPassed = 0;
      troop.patrols.forEach(patrol => {
        patrol.scouts.forEach(scout => {
          totalScouts++; troopScouts++;
          const passed = scout.attendances.filter(a => a.status === 'PASSED');
          const m = passed.filter(a => a.scheduleId).length;
          if (m >= totals.main) { awardCount++; troopPassed++; }
          mainDone += passed.length;
        });
      });
      return { ...troop, scoutCount: troopScouts, completionRate: troopScouts ? Math.round((troopPassed / troopScouts) * 100) : 0 };
    });

    res.json({
      camp,
      stats: {
        totalScouts,
        awardCount,
        awardRate: totalScouts ? Math.round((awardCount / totalScouts) * 100) : 0,
        mainRate: totals.main ? Math.round((mainDone / (totalScouts * totals.main || 1)) * 100) : 0,
      },
      troops: troopsData,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/camp/structure — โครงสร้างค่าย
const getStructure = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const troops = await prisma.troop.findMany({
      where: { campId },
      include: {
        patrols: {
          include: {
            leader: { select: { id: true, displayName: true } },
            _count: { select: { scouts: true } },
          },
        },
      },
      orderBy: { number: 'asc' },
    });
    res.json(troops);
  } catch (err) {
    next(err);
  }
};

// POST /api/camp/troops — สร้างกองใหม่
const createTroop = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const { name, number } = req.body;
    const troop = await prisma.troop.create({ data: { name, number, campId } });
    await createAuditLog({ accountId: req.user.id, action: 'CREATE', entity: 'Troop', entityId: troop.id, newValue: troop, ipAddress: req.ip });
    res.status(201).json(troop);
  } catch (err) {
    next(err);
  }
};

// POST /api/camp/troops/:troopId/patrols — สร้างหมู่ใหม่
const createPatrol = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const { troopId } = req.params;
    const { name, number, leaderId } = req.body;

    const troop = await prisma.troop.findFirst({ where: { id: troopId, campId } });
    if (!troop) return res.status(404).json({ error: 'ไม่พบกอง' });

    const patrol = await prisma.patrol.create({ data: { name, number, troopId, leaderId } });
    await createAuditLog({ accountId: req.user.id, action: 'CREATE', entity: 'Patrol', entityId: patrol.id, newValue: patrol, ipAddress: req.ip });
    res.status(201).json(patrol);
  } catch (err) {
    next(err);
  }
};

// GET /api/camp/patrols/:patrolId — รายละเอียดหมู่
const getPatrol = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const patrol = await prisma.patrol.findFirst({
      where: { id: req.params.patrolId, troop: { campId } },
      include: {
        troop: true,
        leader: { select: { id: true, displayName: true, username: true } },
        scouts: { include: { attendances: { include: { schedule: { include: { activity: true } } } } } },
      },
    });
    if (!patrol) return res.status(404).json({ error: 'ไม่พบหมู่' });
    res.json(patrol);
  } catch (err) {
    next(err);
  }
};

// GET /api/camp/squads/:squadId — รายละเอียดหมู่
const getSquad = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const squad = await prisma.squad.findFirst({
      where: { id: req.params.squadId, troop: { campId } },
      include: {
        troop: true,
        leader: { select: { id: true, displayName: true, username: true } },
        scouts: { include: { attendances: { include: { schedule: { include: { activity: true } } } } } },
      },
    });
    if (!squad) return res.status(404).json({ error: 'ไม่พบหมู่' });
    res.json(squad);
  } catch (err) {
    next(err);
  }
};

// POST /api/camp/scouts — เพิ่มลูกเสือใหมู่ในหมู่
const addScout = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const { patrolId, firstName, lastName, nickname, school, province, phone, email, birthDate } = req.body;

    const patrol = await prisma.patrol.findFirst({ where: { id: patrolId, troop: { campId } } });
    if (!patrol) return res.status(404).json({ error: 'ไม่พบหมู่' });

    const count = await prisma.scout.count();
    const scoutCode = `SC${String(count + 1).padStart(4, '0')}`;

    const scout = await prisma.scout.create({
      data: { scoutCode, firstName, lastName, nickname, school, province, phone, email, birthDate: birthDate ? new Date(birthDate) : undefined, patrolId },
    });

    await createAuditLog({ accountId: req.user.id, scoutId: scout.id, action: 'CREATE', entity: 'Scout', entityId: scout.id, newValue: scout, ipAddress: req.ip });
    res.status(201).json(scout);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/camp/scouts/:id/move — ย้ายลูกเสือ
const moveScout = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const { id } = req.params;
    const { targetPatrolId } = req.body;

    const scout = await prisma.scout.findFirst({ where: { id, patrol: { troop: { campId } } } });
    if (!scout) return res.status(404).json({ error: 'ไม่พบลูกเสือ' });

    const targetPatrol = await prisma.patrol.findFirst({ where: { id: targetPatrolId, troop: { campId } } });
    if (!targetPatrol) return res.status(404).json({ error: 'ไม่พบหมู่ปลายทาง' });

    const oldPatrolId = scout.patrolId;
    const updated = await prisma.scout.update({ where: { id }, data: { patrolId: targetPatrolId } });

    await createAuditLog({ accountId: req.user.id, scoutId: id, action: 'MOVE', entity: 'Scout', entityId: id, oldValue: { patrolId: oldPatrolId }, newValue: { patrolId: targetPatrolId }, ipAddress: req.ip });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/camp/scouts/:id
const removeScout = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const scout = await prisma.scout.findFirst({ where: { id: req.params.id, patrol: { troop: { campId } } } });
    if (!scout) return res.status(404).json({ error: 'ไม่พบลูกเสือ' });

    await prisma.scout.update({ where: { id: req.params.id }, data: { patrolId: null } });
    await createAuditLog({ accountId: req.user.id, scoutId: req.params.id, action: 'REMOVE', entity: 'Scout', entityId: req.params.id, oldValue: { patrolId: scout.patrolId }, ipAddress: req.ip });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/camp/schedule
const getSchedule = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const schedules = await prisma.activitySchedule.findMany({
      where: { campId },
      include: {
        activity: true,
        groups: { include: { patrol: { include: { troop: true } } } },
        _count: { select: { attendances: true } },
      },
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
    });
    res.json(schedules);
  } catch (err) {
    next(err);
  }
};

// POST /api/camp/schedule — สร้างตารางกิจกรรม
const createSchedule = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const { activityId, date, slot, patrolIds, notes } = req.body;

    const activity = await prisma.activity.findUnique({ where: { id: activityId, isActive: true } });
    if (!activity) return res.status(404).json({ error: 'ไม่พบกิจกรรม' });

    const schedule = await prisma.activitySchedule.create({
      data: {
        activityId, campId,
        date: new Date(date),
        slot, notes,
        groups: { create: patrolIds.map(patrolId => ({ patrolId })) },
      },
      include: { activity: true, groups: { include: { patrol: true } } },
    });

    await createAuditLog({ accountId: req.user.id, action: 'CREATE', entity: 'Schedule', entityId: schedule.id, newValue: { activityId, date, slot }, ipAddress: req.ip });
    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
};

// GET /api/camp/report
const getReport = async (req, res, next) => {
  try {
    const campId = getCampId(req);
    const activities = await prisma.activity.findMany({ where: { isActive: true } });
    const scouts = await prisma.scout.findMany({
      where: { patrol: { troop: { campId } } },
      include: { attendances: { include: { schedule: { include: { activity: true } } } } },
    });

    const report = activities.map(act => {
      const scoutsDone = scouts.filter(s => s.attendances.some(a => a.schedule.activityId === act.id && a.status === 'PASSED'));
      return { activity: act, done: scoutsDone.length, total: scouts.length };
    });

    res.json({ report, totalScouts: scouts.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getStructure, createTroop, createPatrol, getPatrol, getSquad, addScout, moveScout, removeScout, getSchedule, createSchedule, getReport };
