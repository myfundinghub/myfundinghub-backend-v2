const transporter = require('../config/nodemailer')

const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }

  } catch (error) {
    console.error('❌ Email error:', error.message)
    throw new Error('Email could not be sent')
  }
}

// ===== OTP EMAIL TEMPLATE =====
const sendOTPEmail = async (email, otp, type = 'verify') => {
  const subject = type === 'verify'
    ? 'Verify Your MyFundingHub Account'
    : 'Reset Your MyFundingHub Password'

  const title = type === 'verify'
    ? 'Email Verification'
    : 'Password Reset'

  const message = type === 'verify'
    ? 'Please use the OTP below to verify your email address.'
    : 'Please use the OTP below to reset your password.'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #0A0E17;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #0D1421;
          border: 1px solid rgba(0,212,255,0.2);
          border-radius: 20px;
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #00D4FF, #1E3A5F);
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 32px;
          font-weight: 900;
          color: white;
          margin-bottom: 5px;
        }
        .logo span {
          color: #FFD700;
        }
        .header p {
          color: rgba(255,255,255,0.8);
          margin: 0;
          font-size: 14px;
        }
        .body {
          padding: 40px 30px;
          text-align: center;
        }
        .title {
          color: white;
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 15px;
        }
        .message {
          color: rgba(255,255,255,0.6);
          font-size: 15px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .otp-box {
          background: rgba(0,212,255,0.1);
          border: 2px solid rgba(0,212,255,0.3);
          border-radius: 16px;
          padding: 25px;
          margin: 20px auto;
          max-width: 300px;
        }
        .otp {
          font-size: 48px;
          font-weight: 900;
          color: #00D4FF;
          letter-spacing: 15px;
        }
        .otp-label {
          color: rgba(255,255,255,0.4);
          font-size: 12px;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .expiry {
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          margin-top: 20px;
        }
        .expiry span {
          color: #FF4444;
          font-weight: 700;
        }
        .footer {
          padding: 20px 30px;
          border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center;
        }
        .footer p {
          color: rgba(255,255,255,0.2);
          font-size: 12px;
          margin: 0;
        }
        .warning {
          background: rgba(255,68,68,0.08);
          border: 1px solid rgba(255,68,68,0.2);
          border-radius: 10px;
          padding: 12px;
          margin-top: 20px;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">My<span>Funding</span>Hub</div>
          <p>Prop Trading — Zero Investment</p>
        </div>
        <div class="body">
          <div class="title">🔐 ${title}</div>
          <p class="message">${message}</p>

          <div class="otp-box">
            <div class="otp">${otp}</div>
            <div class="otp-label">Your OTP Code</div>
          </div>

          <p class="expiry">
            This OTP will expire in <span>10 minutes</span>
          </p>

          <div class="warning">
            ⚠️ Never share this OTP with anyone.
            MyFundingHub will never ask for your OTP.
          </div>
        </div>
        <div class="footer">
          <p>© 2025 MyFundingHub. All Rights Reserved.</p>
          <p style="margin-top: 5px;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await sendEmail({ to: email, subject, html })
}

module.exports = { sendEmail, sendOTPEmail }