const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')

const {
  getProfile,
  updateProfile,
  getMT5Account,
  requestPayout,
  getMyPayouts,
  applyPromo,
  getReferralInfo
} = require('../controllers/userController')

// All routes protected
router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.get('/mt5', protect, getMT5Account)
router.post('/payout', protect, requestPayout)
router.get('/payouts', protect, getMyPayouts)
router.post('/promo/apply', protect, applyPromo)
router.get('/referral', protect, getReferralInfo)

module.exports = router