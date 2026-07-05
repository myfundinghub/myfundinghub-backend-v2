const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // Role
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOTP: String,
  emailOTPExpiry: Date,

  // Password Reset
  resetOTP: String,
  resetOTPExpiry: Date,

  // MT5 Account
  mt5AccountId: {
    type: String,
    default: null
  },
  mt5Login: {
    type: String,
    default: null
  },
  mt5Password: {
    type: String,
    default: null
  },
  mt5Server: {
    type: String,
    default: null
  },

  // Trading Model
  selectedModel: {
    type: String,
    enum: ['instant', '1-step', '2-step', null],
    default: null
  },
  challengeAmount: {
    type: Number,
    default: 0
  },
  challengeStatus: {
    type: String,
    enum: ['none', 'active', 'passed', 'failed'],
    default: 'none'
  },

  // Referral
  referralCode: {
    type: String,
    unique: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralEarnings: {
    type: Number,
    default: 0
  },

  // Promo
  promoCodeUsed: {
    type: String,
    default: null
  },
  discount: {
    type: Number,
    default: 0
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },

  // Profile
  country: String,
  phone: String,

}, { timestamps: true })

// Hash Password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Compare Password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate Referral Code
userSchema.pre('save', function(next) {
  if (!this.referralCode) {
    this.referralCode = 'MFH' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }
  next()
})

module.exports = mongoose.model('User', userSchema)