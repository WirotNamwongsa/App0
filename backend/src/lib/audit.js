import prisma from './prisma.js'

export async function logAudit({ userId, action, target, before, after }) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      target: target || null,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
    }
  })
}
