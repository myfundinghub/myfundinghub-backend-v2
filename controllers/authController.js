const jwt = require('jsonwebtoken')
const User = require('../models/User')
// const { sendOTPEmail } = require('../utils/sendEmail') // Disabled for now

// ===== HELPERS =====
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

// ===== SIGNUP (Without OTP) =====
const signup = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      })
    }

    // Check if user exists
    let user = await User.findOne({ email })
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Create user directly (no OTP verification)
    const newUserData = {
      name,
      email,
      password,
      isEmailVerified: true  // Auto verify
    }

    // Handle referral
    if (referralCode) {
      const refUser = await User.findOne({ referralCode })
      if (refUser) {
        newUserData.referredBy = refUser._id
      }
    }

    user = await User.create(newUserData)

    // Generate token
    const token = generateToken(user._id)

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode
      }
    })
  } catch (error) {
    console.error('Signup error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Signup failed'
    })
  }
}

// ===== VERIFY OTP (Skip - Auto Success) =====
const verifyOTP = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    user.isEmailVerified = true
    await user.save()

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    })
  }
}

// ===== RESEND OTP (Skip) =====
const resendOTP = async (req, res) => {
  res.json({
    success: true,
    message: 'OTP verification is currently disabled'
  })
}

// ===== LOGIN =====
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    const isMatch = await user.comparePassword(password)

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password'
      })
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned'
      })
    }

    const token = generateToken(user._id)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referralCode,
        mt5Login: user.mt5Login,
        mt5Server: user.mt5Server
      }
    })
  } catch (error) {
    console.error('Login error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
}

// ===== FORGOT PASSWORD (Temporarily Disabled) =====
const forgotPassword = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Password reset temporarily disabled. Contact support.'
  })
}

// ===== VERIFY RESET OTP (Disabled) =====
const verifyResetOTP = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Password reset temporarily disabled'
  })
}

// ===== RESET PASSWORD (Disabled) =====
const resetPassword = async (req, res) => {
  res.status(400).json({
    success: false,
    message: 'Password reset temporarily disabled'
  })
}

module.exports = {
  signup,
  verifyOTP,
  resendOTP,
  login,
  forgotPassword,
  verifyResetOTP,
  resetPassword
}