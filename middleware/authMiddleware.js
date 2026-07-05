const jwt = require('jsonwebtoken')
const User = require('../models/User')

// ===== PROTECT ROUTE =====
const protect = async (req, res, next) => {
  try {
    let token

    // Token header se lo
    if (req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Token nahi hai
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized! Please login first.'
      })
    }

    // Token verify karo
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // User find karo
    const user = await User.findById(decoded.id)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found!'
      })
    }

    // Banned check
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned!'
      })
    }

    req.user = user
    next()

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token! Please login again.'
    })
  }
}

// ===== ADMIN ONLY =====
const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    return res.status(403).json({
      success: false,
      message: 'Admin access required!'
    })
  }
}

module.exports = { protect, adminOnly }