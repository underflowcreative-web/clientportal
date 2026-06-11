import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

    // Create Supabase admin client with service_role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Create user via Admin API — email_confirm: true skips the default confirmation email
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'client' },
      })

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      )
    }

    // Now send the branded invite email via SMTP
    const host = process.env.SMTP_HOST
    const port = parseInt(process.env.SMTP_PORT || '587', 10)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM || user

    if (!host || !user || !pass) {
      console.warn('--- EMAIL INVITATION (SMTP NOT CONFIGURED) ---')
      console.warn(`To: ${email}`)
      console.warn(`Name: ${name}`)
      console.warn(`Password: ${password}`)
      console.warn(`Portal Link: ${portalUrl}/login`)
      console.warn('----------------------------------------------')
      return NextResponse.json({
        success: true,
        userId: userData.user.id,
        emailSent: false,
        message: 'Client created. SMTP not configured — credentials logged to console.',
      })
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    const mailOptions = {
      from: `"Underflow Creative" <${from}>`,
      to: email,
      subject: '🎉 Welcome to Your Client Portal — Underflow Creative',
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #0a0a0a; border-radius: 12px; overflow: hidden; border: 3px solid #FF007F;">
          
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #FF007F 0%, #FF6B00 50%, #FAF33E 100%); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 2px;">
              WELCOME ABOARD! 🚀
            </h1>
            <p style="margin: 8px 0 0; font-size: 14px; color: #000000; font-weight: 600;">
              Your client portal is ready, ${name}
            </p>
          </div>

          <!-- Body Content -->
          <div style="padding: 28px 24px; color: #f5f5f5;">
            <p style="font-size: 15px; line-height: 1.6; color: #cccccc; margin: 0 0 20px;">
              Your dedicated client portal has been set up. Track your project progress, view milestones, share files, and communicate with our team — all in one place.
            </p>

            <!-- Credentials Box -->
            <div style="background-color: #1a1a1a; border: 2px solid #FF007F; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-size: 12px; color: #FF007F; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                🔐 Your Login Credentials
              </p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #888888; width: 120px;">Email</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #ffffff; font-weight: 600;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #888888;">Password</td>
                  <td style="padding: 6px 0; font-size: 14px;">
                    <code style="background-color: #2a2a2a; color: #FAF33E; padding: 3px 8px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; border: 1px solid #333;">${password}</code>
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <a href="${portalUrl}/login" style="display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #FF007F, #FF6B00); color: #ffffff; padding: 14px 16px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px; box-sizing: border-box; text-transform: uppercase; letter-spacing: 1px;">
              Go to Your Portal →
            </a>

            <!-- Security Note -->
            <p style="font-size: 12px; color: #666666; text-align: center; margin: 20px 0 0; line-height: 1.5;">
              For security, please change your password after your first login.<br/>
              This invitation was sent by <strong style="color: #FF007F;">Underflow Creative</strong>.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #111111; padding: 16px 24px; text-align: center; border-top: 1px solid #222;">
            <p style="margin: 0; font-size: 11px; color: #555555;">
              © ${new Date().getFullYear()} Underflow Creative · All rights reserved
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      success: true,
      userId: userData.user.id,
      emailSent: true,
    })
  } catch (err: any) {
    console.error('Error creating client:', err)
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
