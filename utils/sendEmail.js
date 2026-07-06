const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendOTPEmail = async (email, otp, type = 'verify') => {
  // Debug logs
  console.log('📧 Attempting to send email...')
  console.log('📧 To:', email)
  console.log('📧 API Key exists:', !!process.env.RESEND_API_KEY)
  console.log('📧 API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 10))

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
        </div>
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: white; margin: 0 0 15px;">🔐 ${title}</h2>
          <p style="color: rgba(255,255,255,0.6); font-size: 15px; margin: 0 0 30px;">${message}</p>
          <div style="background: rgba(0,212,255,0.1); border: 2px solid rgba(0,212,255,0.3); border-radius: 16px; padding: 25px; margin: 20px auto; max-width: 300px;">
            <div style="font-size: 48px; font-weight: 900; color: #00D4FF; letter-spacing: 15px;">${otp}</div>
            <div style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 10px;">YOUR OTP CODE</div>
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 13px;">Expires in 10 minutes</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: 'MyFundingHub <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: html,
    })

    console.log('📧 Resend response:', JSON.stringify(result))

    if (result.error) {
      console.error('❌ Resend error object:', JSON.stringify(result.error))
      throw new Error(result.error.message || 'Resend API error')
    }

    console.log('✅ Email sent successfully! ID:', result.data?.id)
    return result.data
  } catch (error) {
    console.error('❌ FULL ERROR:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error name:', error.name)
    if (error.response) {
      console.error('❌ Error response:', JSON.stringify(error.response))
    }
    throw new Error(`Email failed: ${error.message}`)
  }
}

module.exports = { sendOTPEmail }