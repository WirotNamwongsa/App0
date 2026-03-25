import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'
import { createError } from '../middleware/errorHandler.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) throw createError(400, 'กรุณากรอก username และ password')

  let user = await prisma.user.findUnique({
    where: { username },
    include: {
      camp: { select: { id: true, name: true } },
      leadingSquads: { include: { troop: true } },
      staffActivity: { select: { id: true, name: true } },
      scoutAccount: { select: { id: true, scoutCode: true } }
    }
  })

  if (!user) throw createError(401, 'username หรือ password ไม่ถูกต้อง')

  // ✅ ทุก role ใช้ bcrypt เหมือนกัน
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw createError(401, 'username หรือ password ไม่ถูกต้อง')

  const token = jwt.sign(
    { id: user.id, role: user.role, campId: user.campId },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  )

  const { password: _, ...userSafe } = user
  res.json({ token, user: userSafe })
})

router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      camp: { select: { id: true, name: true } },
      leadingSquads: { include: { troop: true } },
      staffActivity: { select: { id: true, name: true } },
      scoutAccount: true
    }
  })
  const { password: _, ...userSafe } = user
  res.json(userSafe)
})

export default router