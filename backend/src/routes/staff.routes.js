const router = require('express').Router();
const { getMyActivity, scan, batchSync, getScanned } = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('STAFF', 'ADMIN'));

router.get('/activity', getMyActivity);
router.post('/scan', scan);
router.post('/scan/batch', batchSync);
router.get('/scanned/:scheduleId', getScanned);

module.exports = router;