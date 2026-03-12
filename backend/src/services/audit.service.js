// src/services/audit.service.js
const prisma = require('../utils/prisma');

const createAuditLog = async ({ accountId, scoutId, action, entity, entityId, oldValue, newValue, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: { accountId, scoutId, action, entity, entityId, oldValue, newValue, ipAddress },
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};

module.exports = { createAuditLog };
