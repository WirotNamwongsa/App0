// src/routes/admin.routes.js
const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', c.getDashboard);
router.get('/report', c.getReport);
router.get('/activities', c.getActivities);
router.post('/activities', c.createActivity);
router.patch('/activities/:id', c.updateActivity);
router.get('/accounts', c.getAccounts);
router.post('/accounts', c.createAccount);
router.patch('/accounts/:id', c.updateAccount);
router.delete('/accounts/:id', c.deleteAccount);
router.get('/audit', c.getAuditLog);
router.post('/import', c.importScouts);

module.exports = router;
