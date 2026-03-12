// src/controllers/staff.controller.js
const prisma = require('../utils/prisma');

// GET /api/staff/activity — กิจกรรมที่ได้รับมอบหมาย
const getMyActivity = async (req, res, next) => {
  try {
    const staffActivity = req.user.staffActivity;
    if (!staffActivity) return res.status(404).json({ error: 'ไม่ได้รับมอบหมายกิจกรรม' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = await prisma.activitySchedule.findMany({
      where: { activityId: staffActivity.activityId },
      include: {
        camp: true,
        groups: { include: { patrol: { include: { scouts: true } } } },
        _count: { select: { attendances: true } },
      },
      orderBy: { date: 'asc' },
    });

    res.json({ activity: staffActivity.activity, schedules });
  } catch (err) {
    next(err);
  }
};

// POST /api/staff/scan — สแกน QR
const scan = async (req, res, next) => {
  try {
    const { qrToken, scheduleId, status = 'PASSED', notes } = req.body;
    const staffActivity = req.user.staffActivity;

    if (!staffActivity) return res.status(403).json({ error: 'ไม่มีสิทธิ์สแกน' });

    // Find scout
    const scout = await prisma.scout.findUnique({
      where: { qrToken },
      include: { patrol: { include: { troop: true } } },
    });
    if (!scout) return res.status(404).json({ error: 'ไม่พบลูกเสือ', code: 'SCOUT_NOT_FOUND' });

    // Find schedule
    const schedule = await prisma.activitySchedule.findUnique({
      where: { id: scheduleId },
      include: { groups: true },
    });
    if (!schedule) return res.status(404).json({ error: 'ไม่พบตารางกิจกรรม', code: 'SCHEDULE_NOT_FOUND' });

    // Verify this schedule belongs to staff's activity
    if (schedule.activityId !== staffActivity.activityId) {
      return res.status(403).json({ error: 'ไม่ใช่กิจกรรมของคุณ', code: 'WRONG_ACTIVITY' });
    }

    // Check if already scanned
    const existing = await prisma.attendance.findUnique({
      where: { scoutId_scheduleId: { scoutId: scout.id, scheduleId } },
    });

    if (existing) {
      return res.status(409).json({
        error: 'สแกนซ้ำ',
        code: 'DUPLICATE_SCAN',
        scannedAt: existing.scannedAt,
        scout: { firstName: scout.firstName, lastName: scout.lastName },
      });
    }

    // Check if scout is in schedule
    const inSchedule = schedule.groups.some(g => g.patrolId === scout.patrolId);
    const finalStatus = inSchedule ? status : 'SPECIAL';

    const attendance = await prisma.attendance.create({
      data: { scoutId: scout.id, scheduleId, status: finalStatus, notes },
      include: { schedule: { include: { activity: true } } },
    });

    res.status(201).json({
      success: true,
      attendance,
      scout: {
        firstName: scout.firstName,
        lastName: scout.lastName,
        scoutCode: scout.scoutCode,
        patrol: scout.patrol,
      },
      inSchedule,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/staff/scan/batch — batch sync offline scans
const batchSync = async (req, res, next) => {
  try {
    const { scans } = req.body; // array of { qrToken, scheduleId, status, scannedAt }
    const staffActivity = req.user.staffActivity;
    if (!staffActivity) return res.status(403).json({ error: 'ไม่มีสิทธิ์สแกน' });

    const results = [];
    for (const scan of scans) {
      try {
        const scout = await prisma.scout.findUnique({ where: { qrToken: scan.qrToken } });
        if (!scout) { results.push({ ...scan, result: 'SCOUT_NOT_FOUND' }); continue; }

        const existing = await prisma.attendance.findUnique({
          where: { scoutId_scheduleId: { scoutId: scout.id, scheduleId: scan.scheduleId } },
        });
        if (existing) { results.push({ ...scan, result: 'DUPLICATE' }); continue; }

        const schedule = await prisma.activitySchedule.findUnique({
          where: { id: scan.scheduleId },
          include: { groups: true },
        });
        const inSchedule = schedule?.groups.some(g => g.patrolId === scout.patrolId);

        await prisma.attendance.create({
          data: {
            scoutId: scout.id,
            scheduleId: scan.scheduleId,
            status: inSchedule ? (scan.status || 'PASSED') : 'SPECIAL',
            scannedAt: scan.scannedAt ? new Date(scan.scannedAt) : undefined,
            isOffline: true,
          },
        });
        results.push({ ...scan, result: 'SUCCESS' });
      } catch (e) {
        results.push({ ...scan, result: 'ERROR', error: e.message });
      }
    }

    res.json({ synced: results.filter(r => r.result === 'SUCCESS').length, results });
  } catch (err) {
    next(err);
  }
};

// GET /api/staff/scanned/:scheduleId — รายชื่อสแกนแล้ว
const getScanned = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await prisma.activitySchedule.findUnique({
      where: { id: scheduleId },
      include: {
        groups: { include: { patrol: { include: { scouts: true } } } },
        attendances: { include: { scout: { include: { patrol: { include: { troop: true } } } } } },
      },
    });
    if (!schedule) return res.status(404).json({ error: 'ไม่พบตาราง' });

    const allScouts = schedule.groups.flatMap(g => g.patrol.scouts);
    const scannedIds = new Set(schedule.attendances.map(a => a.scoutId));
    const notScanned = allScouts.filter(s => !scannedIds.has(s.id));

    res.json({
      scanned: schedule.attendances,
      notScanned,
      total: allScouts.length,
      scannedCount: schedule.attendances.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyActivity, scan, batchSync, getScanned };
