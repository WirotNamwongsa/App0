// src/routes/leader.routes.js
const router = require('express').Router();
const { getMyPatrol, getScout, getAvailableScouts, addScoutToPatrol, updateScout, getProfile, updateProfile } = require('../controllers/leader.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('TROOP_LEADER', 'ADMIN'));
router.get('/patrol', getMyPatrol);
router.get('/scouts/:id', getScout);
router.get('/available-scouts', getAvailableScouts);
router.post('/add-scout', addScoutToPatrol);
router.patch('/scouts/:id', updateScout);
router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

module.exports = router;
