const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendOTPEmail = async (email, otp, type = 'verify') => {
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
            <div style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 10px; letter-spacing: 2px;">YOUR OTP CODE</div>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 20px 0;">
            This OTP will expire in <span style="color: #FF4444; font-weight: 700;">10 minutes</span>
          </p>
          <div style="background: rgba(255,68,68,0.08); border: 1px solid rgba(255,68,68,0.2); border-radius: 10px; padding: 12px; color: rgba(255,255,255,0.5); font-size: 12px;">
            ⚠️ Never share this OTP with anyone.
          </div>
        </div>
        <div style="padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); text-align: center; color: rgba(255,255,255,0.3); font-size: 12px;">
          © 2025 MyFundingHub. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'MyFundingHub <onboarding@resend.dev>',
      to: email,
      subject: subject,
      html: html,
    })

    if (error) {
      console.error('❌ Email error:', error)
      throw new Error('Email could not be sent')
    }

    console.log('✅ Email sent:', data.id)
    return data
  } catch (error) {
    console.error('❌ Email error:', error.message)
    throw new Error('Email could not be sent')
  }
}

module.exports = { sendOTPEmail }