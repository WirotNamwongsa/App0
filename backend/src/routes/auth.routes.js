// src/routes/auth.routes.js
const router = require('express').Router();
const { login, qrLogin, me } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/qr-login', authenticate, qrLogin);
router.get('/me', authenticate, me);

module.exports = router;
