const Razorpay = require('razorpay')
const crypto = require('crypto')
const axios = require('axios')
const Payment = require('../models/Payment')
const User = require('../models/User')

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Model pricing
const MODEL_PRICING = {
  'instant': {
    5000: 99,
    10000: 149,
    25000: 299,
    50000: 499,
    100000: 899,
    200000: 1699
  },
  '1-step': {
    10000: 49,
    25000: 99,
    50000: 199,
    100000: 399,
    200000: 799
  },
  '2-step': {
    10000: 29,
    25000: 59,
    50000: 119,
    100000: 239,
    200000: 499
  }
}

// ===== GET PRICING =====
const getPricing = async (req, res) => {
  res.json({
    success: true,
    pricing: MODEL_PRICING
  })
}

// ===== CREATE RAZORPAY ORDER =====
const createRazorpayOrder = async (req, res) => {
  try {
    const { model, accountSize } = req.body

    if (!model || !accountSize) {
      return res.status(400).json({
        success: false,
        message: 'Model and account size required'
      })
    }

    const price = MODEL_PRICING[model]?.[accountSize]
    if (!price) {
      return res.status(400).json({
        success: false,
        message: 'Invalid model or account size'
      })
    }

    // Convert USD to INR (approx 83)
    const amountInINR = Math.round(price * 83 * 100) // paise me

    const options = {
      amount: amountInINR,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    }

    const order = await razorpay.orders.create(options)

    // Save to DB
    await Payment.create({
      userId: req.user._id,
      orderId: order.id,
      amount: price,
      currency: 'USD',
      method: 'razorpay',
      status: 'pending',
      model,
      accountSize
    })

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    })
  } catch (error) {
    console.error('Razorpay order error:', error)
    res.status(500).json({
      success: false,
      message: 'Could not create order'
    })
  }
}

// ===== VERIFY RAZORPAY PAYMENT =====
const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      })
    }

    // Update payment
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        status: 'completed',
        transactionId: razorpay_payment_id
      },
      { new: true }
    )

    // Auto assign MT5 (basic - manual admin can update)
    await User.findByIdAndUpdate(payment.userId, {
      selectedModel: payment.model,
      challengeAmount: payment.accountSize,
      challengeStatus: 'active'
    })

    res.json({
      success: true,
      message: 'Payment successful! MT5 account will be assigned shortly.',
      payment
    })
  } catch (error) {
    console.error('Verify error:', error)
    res.status(500).json({
      success: false,
      message: 'Payment verification failed'
    })
  }
}

// ===== CREATE CRYPTO PAYMENT =====
const createCryptoPayment = async (req, res) => {
  try {
    const { model, accountSize, currency = 'usdttrc20' } = req.body

    const price = MODEL_PRICING[model]?.[accountSize]
    if (!price) {
      return res.status(400).json({
        success: false,
        message: 'Invalid model or account size'
      })
    }

    // Create invoice via NOWPayments
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: price,
        price_currency: 'usd',
        pay_currency: currency,
        order_id: `order_${Date.now()}_${req.user._id}`,
        order_description: `MyFundingHub ${model} - $${accountSize}`,
        success_url: `${process.env.FRONTEND_URL}/dashboard?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancel`,
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    )

    const invoice = response.data

    // Save to DB
    await Payment.create({
      userId: req.user._id,
      orderId: invoice.order_id,
      amount: price,
      currency: 'USD',
      method: 'crypto',
      status: 'pending',
      model,
      accountSize,
      paymentDetails: invoice
    })

    res.json({
      success: true,
      invoiceUrl: invoice.invoice_url,
      orderId: invoice.order_id
    })
  } catch (error) {
    console.error('Crypto payment error:', error.response?.data || error.message)
    res.status(500).json({
      success: false,
      message: 'Could not create crypto payment'
    })
  }
}

// ===== CRYPTO WEBHOOK (NOWPayments will call this) =====
const cryptoWebhook = async (req, res) => {
  try {
    const { payment_status, order_id, payment_id, actually_paid } = req.body

    console.log('Crypto webhook received:', req.body)

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      const payment = await Payment.findOneAndUpdate(
        { orderId: order_id },
        {
          status: 'completed',
          paymentId: payment_id,
          transactionId: payment_id
        },
        { new: true }
      )

      if (payment) {
        await User.findByIdAndUpdate(payment.userId, {
          selectedModel: payment.model,
          challengeAmount: payment.accountSize,
          challengeStatus: 'active'
        })
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(500).json({ success: false })
  }
}

// ===== GET USER PAYMENTS =====
const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })

    res.json({
      success: true,
      payments
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Could not get payments'
    })
  }
}

module.exports = {
  getPricing,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createCryptoPayment,
  cryptoWebhook,
  getMyPayments
}