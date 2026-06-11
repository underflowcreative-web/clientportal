import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, portalUrl } = await req.json()

    if (!email || !password || !name || !portalUrl) {
      return NextResponse.json(
        { error: 'Missing required fields (email, password, name, portalUrl)' },
        { status: 400 }
      )
    }

    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || user

    // If SMTP details are not configured, log to console for development
    if (!host || !user || !pass) {
      console.warn('--- EMAIL INVITATION (SMTP NOT CONFIGURED) ---')
      console.warn(`To: ${email}`)
      console.warn(`Name: ${name}`)
      console.warn(`Password: ${password}`)
      console.warn(`Portal Link: ${portalUrl}/login`)
      console.warn('----------------------------------------------')
      return NextResponse.json({
        success: true,
        loggedToConsole: true,
        message: 'SMTP is not configured. Invitation details logged to local terminal console.',
      })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    })

    const mailOptions = {
      from: `"ClientHub Portal" <${from}>`,
      to: email,
      subject: 'Welcome to your Client Portal',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 8px; color: #111827; background-color: #ffffff;">
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #111827;">Welcome to ClientHub, ${name}!</h2>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-bottom: 24px;">Your client portal account has been created. You can use it to track project progress, view milestones, upload files, and review invoices.</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; font-weight: 500;">LOG IN CREDENTIALS</p>
            <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px;">${password}</code></p>
          </div>

          <a href="${portalUrl}/login" style="display: inline-block; width: 100%; text-align: center; background-color: #111827; color: #ffffff; padding: 12px 16px; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 6px; box-sizing: border-box;">Go to Client Portal</a>
          
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">This invitation was sent automatically by ClientHub. Please log in and change your password for security.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error sending invite email:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
