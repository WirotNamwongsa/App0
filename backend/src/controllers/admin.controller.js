// src/controllers/admin.controller.js
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { createAuditLog } = require('../services/audit.service');

// GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [totalScouts, totalCamps, todayScans, camps] = await Promise.all([
      prisma.scout.count(),
      prisma.camp.count(),
      prisma.attendance.count({ where: { scannedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
      prisma.camp.findMany({
        include: {
          troops: { include: { patrols: { include: { _count: { select: { scouts: true } } } } } },
          _count: { select: { schedules: true } },
        },
      }),
    ]);

    res.json({ totalScouts, totalCamps, todayScans, camps });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/activities
const getActivities = async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({
      include: { _count: { select: { schedules: true, staffs: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/activities
const createActivity = async (req, res, next) => {
  try {
    const { name, type, description, location, maxCapacity } = req.body;
    const activity = await prisma.activity.create({ data: { name, type, description, location, maxCapacity } });
    await createAuditLog({ accountId: req.user.id, action: 'CREATE', entity: 'Activity', entityId: activity.id, newValue: activity, ipAddress: req.ip });
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/activities/:id
const updateActivity = async (req, res, next) => {
  try {
    const { name, type, description, location, maxCapacity, isActive } = req.body;
    const activity = await prisma.activity.update({
      where: { id: req.params.id },
      data: { name, type, description, location, maxCapacity, isActive },
    });
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/accounts
const getAccounts = async (req, res, next) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { role: { not: 'SCOUT' } },
      include: {
        camp: { select: { id: true, name: true } },
        patrolLeader: { include: { troop: true } },
        staffActivity: { include: { activity: { select: { id: true, name: true } } } },
      },
      orderBy: { role: 'asc' },
    });
    const safe = accounts.map(({ passwordHash, ...a }) => a);
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/accounts
const createAccount = async (req, res, next) => {
  try {
    const { username, password, role, displayName, campId, activityId } = req.body;
    const passwordHash = await bcrypt.hash(password, 12);

    const account = await prisma.account.create({
      data: { username, passwordHash, role, displayName, campId },
    });

    if (role === 'STAFF' && activityId) {
      await prisma.staffActivity.create({ data: { accountId: account.id, activityId } });
    }

    await createAuditLog({ accountId: req.user.id, action: 'CREATE', entity: 'Account', entityId: account.id, newValue: { username, role, displayName }, ipAddress: req.ip });
    const { passwordHash: _, ...safe } = account;
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/accounts/:id
const updateAccount = async (req, res, next) => {
  try {
    const { displayName, campId, isActive, password, activityId } = req.body;
    const data = { displayName, campId, isActive };
    if (password) data.passwordHash = await bcrypt.hash(password, 12);

    const account = await prisma.account.update({ where: { id: req.params.id }, data });

    if (activityId !== undefined) {
      await prisma.staffActivity.upsert({
        where: { accountId: req.params.id },
        update: { activityId },
        create: { accountId: req.params.id, activityId },
      });
    }

    const { passwordHash, ...safe } = account;
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/accounts/:id
const deleteAccount = async (req, res, next) => {
  try {
    await prisma.account.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/audit
const getAuditLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role, date } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (date) {
      const d = new Date(date);
      where.createdAt = { gte: d, lt: new Date(d.getTime() + 86400000) };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          account: { select: { displayName: true, role: true } },
          scout: { select: { firstName: true, lastName: true, scoutCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/import — Import scouts from JSON array
const importScouts = async (req, res, next) => {
  try {
    const { scouts } = req.body;
    if (!Array.isArray(scouts)) return res.status(400).json({ error: 'scouts must be an array' });

    let created = 0, errors = [];
    const count = await prisma.scout.count();

    for (let i = 0; i < scouts.length; i++) {
      const s = scouts[i];
      try {
        const scoutCode = s.scoutCode || `SC${String(count + i + 1).padStart(4, '0')}`;
        await prisma.scout.create({
          data: {
            scoutCode,
            firstName: s.firstName,
            lastName: s.lastName,
            nickname: s.nickname,
            school: s.school,
            province: s.province,
            phone: s.phone,
            email: s.email,
            patrolId: s.patrolId || null,
          },
        });
        created++;
      } catch (e) {
        errors.push({ row: i + 1, error: e.message });
      }
    }

    res.json({ created, errors, total: scouts.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/report
const getReport = async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({ where: { isActive: true } });
    const camps = await prisma.camp.findMany({ include: { _count: { select: { accounts: true } } } });
    const totalScouts = await prisma.scout.count();
    const totalAttendances = await prisma.attendance.count({ where: { status: 'PASSED' } });

    const actReport = await Promise.all(activities.map(async act => {
      const done = await prisma.attendance.count({ where: { schedule: { activityId: act.id }, status: 'PASSED' } });
      return { ...act, done, total: totalScouts };
    }));

    res.json({ totalScouts, totalAttendances, camps, activities: actReport });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getActivities, createActivity, updateActivity, getAccounts, createAccount, updateAccount, deleteAccount, getAuditLog, importScouts, getReport };
