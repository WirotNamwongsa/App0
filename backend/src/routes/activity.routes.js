// src/routes/activity.routes.js
const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/activities — ดูกิจกรรมทั้งหมด (ทุก role ที่ login แล้ว)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const activities = await prisma.activity.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    res.json(activities);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
