// src/routes/camp.routes.js
const router = require('express').Router();
const c = require('../controllers/camp.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('CAMP_MANAGER', 'ADMIN'));

router.get('/dashboard', c.getDashboard);
router.get('/structure', c.getStructure);
router.post('/troops', c.createTroop);
router.post('/troops/:troopId/patrols', c.createPatrol);
router.get('/patrols/:patrolId', c.getPatrol);
router.post('/scouts', c.addScout);
router.patch('/scouts/:id/move', c.moveScout);
router.delete('/scouts/:id', c.removeScout);
router.get('/schedule', c.getSchedule);
router.post('/schedule', c.createSchedule);
router.get('/report', c.getReport);

module.exports = router;
