import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import scoutRoutes from './routes/scouts.js'
import campRoutes from './routes/camps.js'
import activityRoutes from './routes/activities.js'
import activityGroupRoutes from './routes/activityGroups.js'
import scheduleRoutes from './routes/schedules.js'
import attendanceRoutes from './routes/attendance.js'
import adminRoutes from './routes/admin.js'
import reportRoutes from './routes/reports.js'
import squadRoutes from './routes/squads.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://baby-tiger.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean)
    if (!origin || allowed.some(o => origin.startsWith(o))) {
      callback(null, true)
    } else {
      callback(null, true) // allow all for now
    }
  },
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scouts', scoutRoutes)
app.use('/api/camps', campRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/activity-groups', activityGroupRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/squads', squadRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

// Test endpoint - ไม่ต้อง login
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API ทำงานได้',
    time: new Date(),
    env: process.env.JWT_SECRET ? 'JWT_SECRET มีค่า' : 'JWT_SECRET ไม่มีค่า'
  });
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Jamboree API running on http://localhost:${PORT}`)
})