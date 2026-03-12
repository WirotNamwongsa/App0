// src/routes/scout.routes.js
const router = require('express').Router();
const { getMyProfile, getMyQR, getMySchedule } = require('../controllers/scout.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('SCOUT', 'ADMIN'));
router.get('/me', getMyProfile);
router.get('/me/qr', getMyQR);
router.get('/me/schedule', getMySchedule);

module.exports = router;
