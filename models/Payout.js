const mongoose = require('mongoose')

const payoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  method: {
    type: String,
    enum: ['bank', 'bitcoin', 'usdt', 'paypal'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed'],
    default: 'pending'
  },
  walletAddress: String,
  bankDetails: String,
  adminNote: String
}, { timestamps: true })

module.exports = mongoose.model('Payout', payoutSchema)