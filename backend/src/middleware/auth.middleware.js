// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const account = await prisma.account.findUnique({
      where: { id: decoded.id },
      include: {
        camp: true,
        patrolLeader: true,
        staffActivity: { include: { activity: true } },
      },
    });

    if (!account || !account.isActive) {
      return res.status(401).json({ error: 'บัญชีไม่พบหรือถูกระงับ' });
    }

    req.user = account;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
