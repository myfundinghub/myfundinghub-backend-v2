const express = require('express')
const router = express.Router()
const { protect, adminOnly } = require('../middleware/authMiddleware')

const {
  getStats,
  getAllUsers,
  getUserById,
  updateUser,
  banUser,
  unbanUser,
  deleteUser,
  assignMT5,
  createPromo,
  getAllPromos,
  deletePromo,
  getPayouts,
  updatePayout,
  addSuccessStory,
  getSuccessStories,
  deleteStory
} = require('../controllers/adminController')

// All admin routes protected
router.get('/stats', protect, adminOnly, getStats)
router.get('/users', protect, adminOnly, getAllUsers)
router.get('/users/:id', protect, adminOnly, getUserById)
router.put('/users/:id', protect, adminOnly, updateUser)
router.put('/users/:id/ban', protect, adminOnly, banUser)
router.put('/users/:id/unban', protect, adminOnly, unbanUser)
router.delete('/users/:id', protect, adminOnly, deleteUser)
router.post('/mt5/assign', protect, adminOnly, assignMT5)
router.post('/promo', protect, adminOnly, createPromo)
router.get('/promo', protect, adminOnly, getAllPromos)
router.delete('/promo/:id', protect, adminOnly, deletePromo)
router.get('/payouts', protect, adminOnly, getPayouts)
router.put('/payouts/:id', protect, adminOnly, updatePayout)
router.post('/stories', protect, adminOnly, addSuccessStory)
router.get('/stories', protect, adminOnly, getSuccessStories)
router.delete('/stories/:id', protect, adminOnly, deleteStory)

module.exports = router