// src/controllers/scout.controller.js
const QRCode = require('qrcode');
const prisma = require('../utils/prisma');

// GET /api/scouts/me — ลูกเสือดูข้อมูลตัวเอง
const getMyProfile = async (req, res, next) => {
  try {
    const scoutId = req.user.scoutId || req.user.id;

    const scout = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: {
        patrol: { include: { troop: { include: { camp: true } } } },
        attendances: {
          include: { schedule: { include: { activity: true } } },
          orderBy: { scannedAt: 'desc' },
        },
      },
    });

    if (!scout) return res.status(404).json({ error: 'ไม่พบข้อมูลลูกเสือ' });

    // Count by type
    const allActivities = await prisma.activity.findMany({ where: { isActive: true } });
    const mainTotal = allActivities.filter(a => a.type === 'MAIN').length;
    const specialTotal = allActivities.filter(a => a.type === 'SPECIAL').length;
    const freeTotal = allActivities.filter(a => a.type === 'FREE').length;

    const attended = scout.attendances.filter(a => a.status === 'PASSED');
    const mainDone = attended.filter(a => a.schedule.activity.type === 'MAIN').length;
    const specialDone = attended.filter(a => a.schedule.activity.type === 'SPECIAL').length;
    const freeDone = attended.filter(a => a.schedule.activity.type === 'FREE').length;

    res.json({
      scout,
      progress: {
        main: { done: mainDone, total: mainTotal },
        special: { done: specialDone, total: specialTotal },
        free: { done: freeDone, total: freeTotal },
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/scouts/me/qr — ดู QR Code
const getMyQR = async (req, res, next) => {
  try {
    const scoutId = req.user.scoutId || req.user.id;
    const scout = await prisma.scout.findUnique({ where: { id: scoutId } });
    if (!scout) return res.status(404).json({ error: 'ไม่พบข้อมูลลูกเสือ' });

    const qrDataUrl = await QRCode.toDataURL(scout.qrToken, {
      width: 300,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });

    res.json({ qrDataUrl, scoutCode: scout.scoutCode, qrToken: scout.qrToken });
  } catch (err) {
    next(err);
  }
};

// GET /api/scouts/me/schedule — ตารางกิจกรรมของลูกเสือ
const getMySchedule = async (req, res, next) => {
  try {
    const scoutId = req.user.scoutId || req.user.id;
    const scout = await prisma.scout.findUnique({
      where: { id: scoutId },
      include: { patrol: true },
    });
    if (!scout?.patrolId) return res.json([]);

    const schedules = await prisma.activitySchedule.findMany({
      where: {
        groups: { some: { patrolId: scout.patrolId } },
      },
      include: {
        activity: true,
        groups: { include: { patrol: true } },
      },
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
    });

    // Attach attendance status
    const attendances = await prisma.attendance.findMany({
      where: { scoutId },
    });
    const attMap = Object.fromEntries(attendances.map(a => [a.scheduleId, a]));

    const result = schedules.map(s => ({
      ...s,
      attendance: attMap[s.id] || null,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyProfile, getMyQR, getMySchedule };
