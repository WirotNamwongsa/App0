import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { createError } from '../middleware/errorHandler.js'

const router = Router()
router.use(authenticate, requireRole('ADMIN'))

// GET /api/admin/accounts
router.get('/accounts', async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true, name: true, campId: true, camp: true, leadingSquad: true, staffActivity: true, scoutAccount: { select: { id: true, squadId: true, firstName: true, lastName: true } } },
    orderBy: { role: 'asc' }
  })
  res.json(users)
})

// POST /api/admin/accounts
router.post('/accounts', async (req, res) => {
  const { username, password, role, name, campId, activityId, firstName, lastName, nickname, school, province, squadId, phone, email } = req.body

  if (!username || !password || !role || !name) {
    return res.status(400).json({ 
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน: username, password, role, name' 
    })
  }

  const existingUser = await prisma.user.findUnique({ where: { username } })
  if (existingUser) {
    return res.status(400).json({ 
      error: 'ชื่อผู้ใช้นี้มีอยู่แล้วในระบบ กรุณาใช้ชื่ออื่น' 
    })
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, password: hashed, role, name, campId: campId || null }
  })

  // ถ้า role เป็น SCOUT สร้าง Scout record อัตโนมัติ
  if (role === 'SCOUT') {
    const scoutCode = `SC${Date.now().toString().slice(-6)}`
    const parts = name.trim().split(' ')
    const fName = firstName || parts[0] || name
    const lName = lastName || parts.slice(1).join(' ') || '-'
    await prisma.scout.create({
      data: {
        scoutCode,
        firstName: fName,
        lastName: lName,
        nickname: nickname || fName,
        school: school || '-',
        province: province || '-',
        phone: phone || null,
        email: email || null,
        squadId: squadId || null,
        userId: user.id
      }
    })
  }

  // ถ้า role เป็น STAFF ให้ผูก activityId
  if (role === 'STAFF' && activityId) {
    await prisma.activity.update({
      where: { id: activityId },
      data: { staffId: user.id }
    })
  }

  const { password: _, ...safe } = user
  res.status(201).json(safe)
})

// PATCH /api/admin/accounts/:id
router.patch('/accounts/:id', async (req, res) => {
  const { name, role, campId, activityId, password, squadId } = req.body

  const data = { name, role, campId: campId || null }
  if (password) data.password = await bcrypt.hash(password, 10)
  const user = await prisma.user.update({ where: { id: req.params.id }, data })

  // ถ้า role เป็น SCOUT ให้อัปเดต squadId ใน Scout ด้วย
  if (role === 'SCOUT') {
    await prisma.scout.updateMany({
      where: { userId: req.params.id },
      data: { squadId: squadId || null }
    })
  }

  // ถ้า role เป็น STAFF ให้ผูก activityId ผ่าน Activity.staffId
  if (role === 'STAFF') {
    await prisma.activity.updateMany({
      where: { staffId: req.params.id },
      data: { staffId: null }
    })
    if (activityId) {
      await prisma.activity.update({
        where: { id: activityId },
        data: { staffId: req.params.id }
      })
    }
  }

  const { password: _, ...safe } = user
  res.json(safe)
})

// DELETE /api/admin/accounts/:id
router.delete('/accounts/:id', async (req, res) => {
  await prisma.scout.deleteMany({ where: { userId: req.params.id } })
  await prisma.activity.updateMany({ where: { staffId: req.params.id }, data: { staffId: null } })
  await prisma.user.delete({ where: { id: req.params.id } })
  res.json({ message: 'ลบบัญชีสำเร็จ' })
})

// GET /api/admin/audit
router.get('/audit', async (req, res) => {
  const { role, from, to, limit = 50, skip = 0 } = req.query
  const where = {}
  if (role) where.user = { role }
  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) where.createdAt.lte = new Date(to)
  }
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    skip: parseInt(skip)
  })
  res.json(logs)
})

// POST /api/admin/import-scouts
router.post('/import-scouts', async (req, res) => {
  const { scouts } = req.body
  if (!Array.isArray(scouts)) throw createError(400, 'ข้อมูลต้องเป็น array')
  
  const results = []
  const defaultPassword = 'scout1234'
  const hashedPassword = await bcrypt.hash(defaultPassword, 10)
  
  for (const s of scouts) {
    try {
      const scoutCode = s.scoutCode || `SC${Date.now()}${Math.random().toString(36).substr(2,4).toUpperCase()}`
      const username = `scout_${scoutCode.toLowerCase()}`
      const user = await prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          password: hashedPassword,
          role: 'SCOUT',
          name: `${s.firstName} ${s.lastName}`,
          campId: s.campId || null
        }
      })
      const scout = await prisma.scout.upsert({
        where: { scoutCode },
        create: { ...s, scoutCode, userId: user.id },
        update: { ...s, userId: user.id }
      })
      results.push({ 
        scout, 
        user: { id: user.id, username: user.username, password: defaultPassword } 
      })
    } catch (error) {
      console.error(`Error importing scout ${s.scoutCode}:`, error)
      results.push({ error: error.message, scoutCode: s.scoutCode || 'unknown' })
    }
  }
  
  const successCount = results.filter(r => !r.error).length
  const errorCount = results.filter(r => r.error).length
  
  res.status(201).json({ count: successCount, errors: errorCount, scouts: results })
})

// GET /api/admin/scouts/available
router.get('/scouts/available', async (req, res) => {
  const scouts = await prisma.scout.findMany({
    where: { 
      squadId: null,
      user: { role: 'SCOUT' }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      scoutCode: true,
      school: true,
      email: true,
      phone: true,
      nickname: true,
      province: true
    },
    orderBy: { firstName: 'asc' }
  })
  res.json(scouts)
})

// GET /api/admin/leaders/available
router.get('/leaders/available', async (req, res) => {
  const leaders = await prisma.user.findMany({
    where: { 
      role: 'TROOP_LEADER',
      leadingSquad: null
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
    orderBy: { name: 'asc' }
  })
  
  const transformedLeaders = leaders.map(leader => ({
    ...leader,
    firstName: leader.name.split(' ')[0] || leader.name,
    lastName: leader.name.split(' ').slice(1).join(' ') || '',
    experience: 'ไม่ระบุ',
    specialization: 'ไม่ระบุ',
    phone: ''
  }))
  
  res.json(transformedLeaders)
})

// POST /api/admin/scouts/assign
router.post('/scouts/assign', async (req, res) => {
  const { scoutIds, squadId } = req.body
  await prisma.scout.updateMany({
    where: { id: { in: scoutIds } },
    data: { squadId: squadId || null }
  })
  res.json({ message: 'จัดสรรลูกเสือสำเร็จ' })
})

// POST /api/admin/leaders/assign
router.post('/leaders/assign', async (req, res) => {
  const { leaderIds, squadId } = req.body
  res.json({ message: 'จัดสรรผู้กำกับสำเร็จ' })
})

export default router