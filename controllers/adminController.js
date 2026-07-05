const User = require('../models/User')
const PromoCode = require('../models/PromoCode')
const Payout = require('../models/Payout')
const SuccessStory = require('../models/SuccessStory')

// ===== GET ADMIN STATS =====
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true, isEmailVerified: true })
    const bannedUsers = await User.countDocuments({ isBanned: true })
    const pendingPayouts = await Payout.countDocuments({ status: 'pending' })
    const totalPayouts = await Payout.aggregate([
      { $match: { status: 'processed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        pendingPayouts,
        totalPaidOut: totalPayouts[0]?.total || 0
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get stats'
    })
  }
}

// ===== GET ALL USERS =====
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: users.length,
      users
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get users'
    })
  }
}

// ===== GET USER BY ID =====
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get user'
    })
  }
}

// ===== UPDATE USER =====
const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not update user'
    })
  }
}

// ===== BAN USER =====
const banUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true, isActive: false },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      message: `${user.name} has been banned`,
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not ban user'
    })
  }
}

// ===== UNBAN USER =====
const unbanUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false, isActive: true },
      { new: true }
    ).select('-password')

    res.status(200).json({
      success: true,
      message: `${user.name} has been unbanned`,
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not unban user'
    })
  }
}

// ===== DELETE USER =====
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not delete user'
    })
  }
}

// ===== ASSIGN MT5 ACCOUNT =====
const assignMT5 = async (req, res) => {
  try {
    const { userId, mt5Login, mt5Password, mt5Server, mt5AccountId, selectedModel, challengeAmount } = req.body

    if (!userId || !mt5Login || !mt5Password || !mt5Server) {
      return res.status(400).json({
        success: false,
        message: 'All MT5 fields are required'
      })
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        mt5Login,
        mt5Password,
        mt5Server,
        mt5AccountId,
        selectedModel,
        challengeAmount,
        challengeStatus: 'active'
      },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.status(200).json({
      success: true,
      message: `MT5 account assigned to ${user.name}`,
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not assign MT5 account'
    })
  }
}

// ===== CREATE PROMO CODE =====
const createPromo = async (req, res) => {
  try {
    const { code, discountType, discountValue, maxUses, expiryDate } = req.body

    if (!code || !discountValue) {
      return res.status(400).json({
        success: false,
        message: 'Code and discount value are required'
      })
    }

    const existing = await PromoCode.findOne({ code: code.toUpperCase() })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Promo code already exists'
      })
    }

    const promo = await PromoCode.create({
      code: code.toUpperCase(),
      discountType: discountType || 'percentage',
      discountValue,
      maxUses: maxUses || 100,
      expiryDate
    })

    res.status(201).json({
      success: true,
      message: 'Promo code created',
      promo
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not create promo code'
    })
  }
}

// ===== GET ALL PROMOS =====
const getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: promos.length,
      promos
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get promos'
    })
  }
}

// ===== DELETE PROMO =====
const deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id)

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Promo code not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Promo code deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not delete promo'
    })
  }
}

// ===== GET ALL PAYOUTS =====
const getPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: payouts.length,
      payouts
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get payouts'
    })
  }
}

// ===== UPDATE PAYOUT =====
const updatePayout = async (req, res) => {
  try {
    const { status, adminNote } = req.body

    const payout = await Payout.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    ).populate('userId', 'name email')

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      })
    }

    res.status(200).json({
      success: true,
      message: `Payout ${status}`,
      payout
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not update payout'
    })
  }
}

// ===== ADD SUCCESS STORY =====
const addSuccessStory = async (req, res) => {
  try {
    const story = await SuccessStory.create(req.body)

    res.status(201).json({
      success: true,
      message: 'Success story added',
      story
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not add story'
    })
  }
}

// ===== GET ALL STORIES =====
const getSuccessStories = async (req, res) => {
  try {
    const stories = await SuccessStory.find()
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: stories.length,
      stories
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get stories'
    })
  }
}

// ===== DELETE STORY =====
const deleteStory = async (req, res) => {
  try {
    await SuccessStory.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Story deleted'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not delete story'
    })
  }
}

module.exports = {
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
}