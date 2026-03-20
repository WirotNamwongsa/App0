import jwt from 'jsonwebtoken'
import { createError } from './errorHandler.js'

export function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) throw createError(401, 'กรุณาเข้าสู่ระบบ')
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    throw createError(401, 'Token ไม่ถูกต้องหรือหมดอายุ')
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    console.log('=== AUTH DEBUG ===')
    console.log('User role:', req.user.role)
    console.log('Required roles:', roles)
    console.log('Has access:', roles.includes(req.user.role))
    
    if (!roles.includes(req.user.role)) {
      throw createError(403, 'ไม่มีสิทธิ์เข้าถึง')
    }
    next()
  }
}
