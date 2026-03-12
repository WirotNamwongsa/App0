import 'dotenv/config'
import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.js'
import scoutRoutes from './routes/scouts.js'
import campRoutes from './routes/camps.js'
import activityRoutes from './routes/activities.js'
import scheduleRoutes from './routes/schedules.js'
import attendanceRoutes from './routes/attendance.js'
import adminRoutes from './routes/admin.js'
import reportRoutes from './routes/reports.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/scouts', scoutRoutes)
app.use('/api/camps', campRoutes)
app.use('/api/activities', activityRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Jamboree API running on http://localhost:${PORT}`)
})
