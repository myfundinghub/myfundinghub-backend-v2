const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { sendOTPEmail } = require('../utils/sendEmail')

// ===== HELPERS =====
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ===== SIGNUP =====
const signup = async (req, res) => {
  try {
    const { name, email, password, referralCode } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required'
      })
    }

    let user = await User.findOne({ email })

    // If already verified user exists
    if (user && user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 min

    // If unverified user already exists, update it
    if (user && !user.isEmailVerified) {
      user.name = name
      user.password = password
      user.emailOTP = otp
      user.emailOTPExpiry = otpExpiry
      if (referralCode) {
        const refUser = await User.findOne({ referralCode })
        if (refUser) user.referredBy = refUser._id
      }
      await user.save()
    } else {
      const newUserData = {
        name,
        email,
        password,
        emailOTP: otp,
        emailOTPExpiry: otpExpiry
      }

      if (referralCode) {
        const refUser = await User.findOne({ referralCode })
        if (refUser) {
          newUserData.referredBy = refUser._id
        }
      }

      user = await User.create(newUserData)
    }

    await sendOTPEmail(email, otp, 'verify')

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      email
    })
  } catch (error) {
    console.error('Signup error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Signup failed'
    })
  }
}

// ===== VERIFY EMAIL OTP =====
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.emailOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      })
    }

    if (!user.emailOTPExpiry || user.emailOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      })
    }

    user.isEmailVerified = true
    user.emailOTP = undefined
    user.emailOTPExpiry = undefined
    await user.save()

    const token = generateToken(user._id)

    res.status(200).json({
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
    console.error('Verify OTP error:', error.message)
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    })
  }
}

// ===== RESEND OTP =====
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      })
    }

    const otp = generateOTP()
    user.emailOTP = otp
    user.emailOTPExpiry = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendOTPEmail(email, otp, 'verify')

    res.status(200).json({
      success: true,
      message: 'OTP resent successfully'
    })
  } catch (error) {
    console.error('Resend OTP error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Could not resend OTP'
    })
  }
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first'
      })
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned'
      })
    }

    const token = generateToken(user._id)

    res.status(200).json({
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

// ===== FORGOT PASSWORD =====
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    const otp = generateOTP()
    user.resetOTP = otp
    user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000)
    await user.save()

    await sendOTPEmail(email, otp, 'reset')

    res.status(200).json({
      success: true,
      message: 'Reset OTP sent to your email'
    })
  } catch (error) {
    console.error('Forgot password error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Could not send reset OTP'
    })
  }
}

// ===== VERIFY RESET OTP =====
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      })
    }

    if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      })
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully'
    })
  } catch (error) {
    console.error('Verify reset OTP error:', error.message)
    res.status(500).json({
      success: false,
      message: 'OTP verification failed'
    })
  }
}

// ===== RESET PASSWORD =====
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP and new password are required'
      })
    }

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      })
    }

    if (!user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired'
      })
    }

    user.password = newPassword
    user.resetOTP = undefined
    user.resetOTPExpiry = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    })
  } catch (error) {
    console.error('Reset password error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    })
  }
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