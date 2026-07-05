const User = require('../models/User')
const Payout = require('../models/Payout')
const PromoCode = require('../models/PromoCode')

// ===== GET PROFILE =====
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('referredBy', 'name email')

    res.status(200).json({
      success: true,
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get profile'
    })
  }
}

// ===== UPDATE PROFILE =====
const updateProfile = async (req, res) => {
  try {
    const { name, phone, country } = req.body

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, country },
      { new: true, runValidators: true }
    )

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not update profile'
    })
  }
}

// ===== GET MT5 ACCOUNT =====
const getMT5Account = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user.mt5Login) {
      return res.status(404).json({
        success: false,
        message: 'No MT5 account assigned yet'
      })
    }

    res.status(200).json({
      success: true,
      mt5: {
        login: user.mt5Login,
        password: user.mt5Password,
        server: user.mt5Server,
        accountId: user.mt5AccountId,
        model: user.selectedModel,
        challengeStatus: user.challengeStatus,
        challengeAmount: user.challengeAmount
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get MT5 account'
    })
  }
}

// ===== REQUEST PAYOUT =====
const requestPayout = async (req, res) => {
  try {
    const { amount, method, walletAddress, bankDetails } = req.body

    if (!amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Amount and method are required'
      })
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payout amount is $100'
      })
    }

    const payout = await Payout.create({
      userId: req.user._id,
      amount,
      method,
      walletAddress,
      bankDetails,
      status: 'pending'
    })

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      payout
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not submit payout request'
    })
  }
}

// ===== GET MY PAYOUTS =====
const getMyPayouts = async (req, res) => {
  try {
    const payouts = await Payout.find({ userId: req.user._id })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      payouts
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get payouts'
    })
  }
}

// ===== APPLY PROMO CODE =====
const applyPromo = async (req, res) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required'
      })
    }

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      isActive: true
    })

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired promo code'
      })
    }

    if (promo.expiryDate && promo.expiryDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Promo code has expired'
      })
    }

    if (promo.usedCount >= promo.maxUses) {
      return res.status(400).json({
        success: false,
        message: 'Promo code usage limit reached'
      })
    }

    const user = await User.findById(req.user._id)

    if (user.promoCodeUsed) {
      return res.status(400).json({
        success: false,
        message: 'You have already used a promo code'
      })
    }

    // Apply promo
    user.promoCodeUsed = promo.code
    user.discount = promo.discountType === 'percentage'
      ? promo.discountValue
      : promo.discountValue

    await user.save()

    // Update promo usage
    promo.usedCount += 1
    await promo.save()

    res.status(200).json({
      success: true,
      message: `Promo code applied! ${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} discount applied`,
      discount: promo.discountValue,
      discountType: promo.discountType
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not apply promo code'
    })
  }
}

// ===== GET REFERRAL INFO =====
const getReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)

    // Count referrals
    const referrals = await User.find({
      referredBy: req.user._id,
      isEmailVerified: true
    }).select('name email createdAt')

    res.status(200).json({
      success: true,
      referralCode: user.referralCode,
      referralLink: `${process.env.FRONTEND_URL}/signup?ref=${user.referralCode}`,
      totalReferrals: referrals.length,
      referralEarnings: user.referralEarnings,
      referrals
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get referral info'
    })
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getMT5Account,
  requestPayout,
  getMyPayouts,
  applyPromo,
  getReferralInfo
}