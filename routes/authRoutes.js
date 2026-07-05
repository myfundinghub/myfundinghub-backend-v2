const express = require('express')
const router = express.Router()

const {
  signup,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} = require('../controllers/authController')

// Auth Routes
router.post('/signup', signup)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-reset-otp', verifyResetOTP)
router.post('/reset-password', resetPassword)

module.exports = router