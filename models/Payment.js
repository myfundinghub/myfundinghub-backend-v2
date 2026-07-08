const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  method: {
    type: String,
    enum: ['razorpay', 'crypto'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  model: {
    type: String,
    enum: ['instant', '1-step', '2-step'],
    required: true
  },
  accountSize: {
    type: Number,
    required: true
  },
  promoCode: String,
  discount: {
    type: Number,
    default: 0
  },
  paymentDetails: Object,
  transactionId: String,
}, { timestamps: true })

module.exports = mongoose.model('Payment', paymentSchema)