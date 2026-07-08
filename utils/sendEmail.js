const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,          // ← 465 use karo (587 nahi!)
  secure: true,       // ← true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
})

const sendOTPEmail = async (email, otp, type = 'verify') => {
  console.log('📧 Sending email to:', email)

  const subject = type === 'verify'
    ? 'Verify Your MyFundingHub Account'
    : 'Reset Your MyFundingHub Password'

  const title = type === 'verify' ? 'Email Verification' : 'Password Reset'
  const message = type === 'verify'
    ? 'Please use the OTP below to verify your email address.'
    : 'Please use the OTP below to reset your password.'

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; background: #0A0E17; margin: 0; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #0D1421; border: 1px solid rgba(0,212,255,0.2); border-radius: 20px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00D4FF, #1E3A5F); padding: 40px; text-align: center;">
          <h1 style="color: white; font-size: 32px; margin: 0;">My<span style="color: #FFD700;">Funding</span>Hub</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Prop Trading — Zero Investment</p>
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: white; margin: 0 0 15px;">🔐 ${title}</h2>
          <p style="color: rgba(255,255,255,0.6); font-size: 15px; margin: 0 0 30px;">${message}</p>
          <div style="background: rgba(0,212,255,0.1); border: 2px solid rgba(0,212,255,0.3); border-radius: 16px; padding: 25px; margin: 20px auto; max-width: 300px;">
            <div style="font-size: 48px; font-weight: 900; color: #00D4FF; letter-spacing: 15px;">${otp}</div>
            <div style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 10px;">YOUR OTP CODE</div>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px;">Expires in <strong style="color: #FF4444;">10 minutes</strong></p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject,
      html: html,
    })

    console.log('✅ Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('❌ Email error:', error.message)
    throw new Error(`Email failed: ${error.message}`)
  }
}

module.exports = { sendOTPEmail }