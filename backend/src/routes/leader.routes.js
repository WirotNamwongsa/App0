// src/routes/leader.routes.js
const router = require('express').Router();
const { getMyPatrol, getScout, updateScout } = require('../controllers/leader.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('TROOP_LEADER', 'ADMIN'));
router.get('/patrol', getMyPatrol);
router.get('/scouts/:id', getScout);
router.patch('/scouts/:id', updateScout);

module.exports = router;
