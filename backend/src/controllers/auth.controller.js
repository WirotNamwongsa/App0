// src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอก username และ password' });
    }

    const account = await prisma.account.findUnique({
      where: { username },
      include: {
        camp: true,
        patrolLeader: { include: { troop: true } },
        staffActivity: { include: { activity: true } },
      },
    });

    if (!account || !account.isActive) {
      return res.status(401).json({ error: 'ไม่พบบัญชีหรือบัญชีถูกระงับ' });
    }

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: account.id, role: account.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { passwordHash, ...accountData } = account;

    res.json({ token, user: accountData });
  } catch (err) {
    next(err);
  }
};

// QR Login — ผู้กำกับสแกน QR ลูกเสือเพื่อ login แทน
const qrLogin = async (req, res, next) => {
  try {
    const { qrToken } = req.body;

    const scout = await prisma.scout.findUnique({
      where: { qrToken },
      include: {
        patrol: { include: { troop: { include: { camp: true } } } },
      },
    });

    if (!scout) {
      return res.status(404).json({ error: 'ไม่พบลูกเสือ' });
    }

    // Check that requester is the troop leader of this patrol
    const { role, patrolLeader } = req.user;
    if (role !== 'ADMIN' && patrolLeader?.id !== scout.patrolId) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าสู่ระบบแทนลูกเสือคนนี้' });
    }

    const token = jwt.sign(
      { id: scout.id, role: 'SCOUT', scoutId: scout.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, scout });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res) => {
  const { passwordHash, ...user } = req.user;
  res.json(user);
};

module.exports = { login, qrLogin, me };
