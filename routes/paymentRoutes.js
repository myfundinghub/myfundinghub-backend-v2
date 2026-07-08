const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')

const {
  getPricing,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCryptoPayment,
  cryptoWebhook,
  getMyPayments
} = require('../controllers/paymentController')

// Public
router.get('/pricing', getPricing)
router.post('/crypto/webhook', cryptoWebhook)

// Protected
router.post('/razorpay/create-order', protect, createRazorpayOrder)
router.post('/razorpay/verify', protect, verifyRazorpayPayment)
router.post('/crypto/create', protect, createCryptoPayment)
router.get('/my-payments', protect, getMyPayments)

module.exports = router