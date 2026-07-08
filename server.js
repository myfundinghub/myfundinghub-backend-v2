const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()

// Security
app.use(helmet())

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests!' }
})
app.use('/api/', limiter)

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/user', require('./routes/userRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api/payment', require('./routes/paymentRoutes'))

// Health Check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 MyFundingHub API Running!',
    status: 'active'
  })
})

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`
🚀 ====================================
   MyFundingHub Server Started!
   Port: ${PORT}
   Mode: ${process.env.NODE_ENV}
   URL: http://localhost:${PORT}
====================================
  `)
})