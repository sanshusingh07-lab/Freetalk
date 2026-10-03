import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// In-memory store of recently dispatched emails for development inspection & testing
const dispatchedEmailsLog = [];

/**
 * Creates and returns the active nodemailer transport.
 * Uses real SMTP if environment variables are supplied;
 * otherwise uses JSON stream transport for local development and logs clearly.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, '');
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (user && pass) {
    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 12000,
      socketTimeout: 15000
    });
  }

  // Development / fallback transporter that captures message structure cleanly
  return nodemailer.createTransport({
    jsonTransport: true
  });
}

const transporter = createTransporter();
const EMAIL_FROM = process.env.EMAIL_FROM || '"FreeTalk Security" <notifications@freetalk.internal>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Common HTML email layout with FreeTalk's warm editorial aesthetic.
 */
function buildEditorialEmailHtml({ title, preheader, headline, contentHtml, ctaText, ctaLink }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #F7F5F0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #000000;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F7F5F0;
      padding: 40px 15px;
      box-sizing: border-box;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E2DED5;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }
    .header {
      padding: 28px 32px 20px 32px;
      border-bottom: 1px solid #EFECE4;
      background-color: #FFFFFF;
    }
    .logo {
      font-family: 'Georgia', serif;
      font-size: 22px;
      font-weight: 700;
      color: #000000;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .logo span {
      color: #C45A3C;
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #C45A3C;
      background-color: #FAF0EC;
      border: 1px solid #DEACA0;
      padding: 3px 8px;
      border-radius: 4px;
      margin-left: 8px;
    }
    .tagline {
      font-size: 11px;
      color: #555555;
      margin-top: 4px;
      font-style: italic;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
      font-size: 14px;
      color: #111111;
    }
    .headline {
      font-family: 'Georgia', serif;
      font-size: 22px;
      font-weight: 700;
      color: #000000;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .card-box {
      background-color: #FAF9F6;
      border: 1px solid #E8E4DA;
      border-radius: 8px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #EFECE4;
      font-size: 13px;
    }
    .card-row:last-child {
      border-bottom: none;
    }
    .card-label {
      color: #666666;
      font-weight: 500;
    }
    .card-value {
      color: #000000;
      font-weight: 600;
    }
    .btn {
      display: inline-block;
      background-color: #C45A3C;
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      padding: 12px 24px;
      border-radius: 6px;
      margin: 20px 0 10px 0;
      text-align: center;
    }
    .footer {
      padding: 24px 32px;
      background-color: #F7F5F0;
      border-top: 1px solid #E2DED5;
      font-size: 11px;
      color: #555555;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#F7F5F0;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader || title}
  </div>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <a href="${FRONTEND_URL}" class="logo">FreeTalk<span>.</span></a>
        <span class="badge">Official Security Notice</span>
        <div class="tagline">Ideas over identity &bull; Anonymous by design</div>
      </div>
      <div class="content">
        <h1 class="headline">${headline}</h1>
        ${contentHtml}
        ${ctaText && ctaLink ? `
          <div style="text-align: center; margin-top: 24px;">
            <a href="${ctaLink}" class="btn" target="_blank">${ctaText} &rarr;</a>
          </div>
        ` : ''}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">This automated security dispatch was sent from <strong>FreeTalk</strong> to keep your account safe.</p>
        <p style="margin: 0;">Your real email and location are strictly air-gapped and never displayed publicly or shared with other members.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends a welcome / registration confirmation email.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.displayName - Assigned anonymous identity
 * @param {string} options.email - User registered email
 */
export async function sendSignupEmail({ to, displayName, email }) {
  try {
    const subject = "Welcome to FreeTalk — Account Created Successfully";
    const homeUrl = `${FRONTEND_URL}/home`;

    const contentHtml = `
      <p style="margin-top: 0;">Hello,</p>
      <p>Your FreeTalk account has been <strong>successfully created and registered</strong> with the email address <code>${email}</code>.</p>
      
      <div class="card-box">
        <div class="card-row">
          <span class="card-label">Registered Account</span>
          <span class="card-value">${email}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Your Anonymous Alias</span>
          <span class="card-value" style="color: #C45A3C;">🎭 ${displayName || 'Anonymous Thinker'}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Identity Privacy</span>
          <span class="card-value" style="color: #68735B;">Air-Gapped &bull; 100% Private</span>
        </div>
      </div>

      <p><strong>How FreeTalk protects you:</strong></p>
      <ul style="padding-left: 20px; margin: 10px 0; color: #333333;">
        <li>Your email is never shown publicly, stored in public posts, or shared with other users.</li>
        <li>All discussions, comments, and blind debates will be posted exclusively under your anonymous identity.</li>
        <li>You can regenerate your anonymous persona at any time in Settings.</li>
      </ul>

      <p style="margin-bottom: 0;">Step inside to participate in thoughtful discussions, explore mind-changing debates, and share your perspective freely.</p>
    `;

    const text = `Welcome to FreeTalk!\n\nYour account has been successfully created with email: ${email}.\nYour initial anonymous identity is: ${displayName || 'Anonymous Thinker'}.\n\nYour real email is air-gapped and never shared publicly.\nVisit FreeTalk: ${homeUrl}\n\n- The FreeTalk Team`;

    const html = buildEditorialEmailHtml({
      title: subject,
      preheader: `Your FreeTalk account has been successfully created as ${displayName}.`,
      headline: "Welcome to FreeTalk",
      contentHtml,
      ctaText: "Start Exploring Discussions",
      ctaLink: homeUrl
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    const logEntry = {
      type: 'SIGNUP',
      to,
      subject,
      timestamp: new Date().toISOString(),
      messageId: info.messageId || 'dev-stream'
    };
    dispatchedEmailsLog.unshift(logEntry);
    if (dispatchedEmailsLog.length > 50) dispatchedEmailsLog.pop();

    console.log(`[EmailService] 📧 Welcome email sent to: ${to} (User: ${displayName})`);
    return { success: true, info };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send signup email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a security notification email when a user logs in successfully.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.email - Account email
 * @param {string} options.displayName - User's active anonymous pseudonym
 * @param {string} options.ip - Client IP address
 * @param {string} options.userAgent - Client User-Agent string
 * @param {Date} [options.timestamp] - Login timestamp
 */
export async function sendLoginNotificationEmail({ to, email, displayName, ip, userAgent, timestamp = new Date() }) {
  try {
    const subject = "Security Alert: Successful Login to Your FreeTalk Account";
    const settingsUrl = `${FRONTEND_URL}/settings`;
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(timestamp);

    // Simplified friendly device name
    let deviceSummary = "Web Browser";
    if (userAgent) {
      if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
        deviceSummary = "Mobile Device";
      } else if (userAgent.includes('Windows')) {
        deviceSummary = "Windows Desktop";
      } else if (userAgent.includes('Macintosh')) {
        deviceSummary = "Mac Desktop";
      } else if (userAgent.includes('Linux')) {
        deviceSummary = "Linux Desktop";
      }
    }

    const cleanIp = ip && ip !== '::1' && ip !== '127.0.0.1' ? ip : '127.0.0.1 (Localhost)';

    const contentHtml = `
      <p style="margin-top: 0;">Hello,</p>
      <p>We detected a <strong>successful sign-in</strong> to your FreeTalk account.</p>

      <div class="card-box">
        <div class="card-row">
          <span class="card-label">Account</span>
          <span class="card-value">${email}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Active Anonymous Persona</span>
          <span class="card-value">${displayName || 'Anonymous Member'}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Login Time</span>
          <span class="card-value">${formattedDate}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Device Type</span>
          <span class="card-value">${deviceSummary}</span>
        </div>
        <div class="card-row">
          <span class="card-label">IP Address</span>
          <span class="card-value" style="font-family: monospace;">${cleanIp}</span>
        </div>
      </div>

      <p><strong>Was this you?</strong></p>
      <p style="color: #333333;">If you just signed in, you can safely disregard this email. No further action is required.</p>
      <p style="color: #C45A3C; font-weight: 500;">If you did not log in, someone else may have access to your credentials. Please secure your account immediately by changing your password in Settings.</p>
    `;

    const text = `FreeTalk Security Notice: Successful Login Detected\n\nAccount: ${email}\nPersona: ${displayName || 'Anonymous Member'}\nTime: ${formattedDate}\nDevice: ${deviceSummary}\nIP: ${cleanIp}\n\nIf this was you, you can safely ignore this message.\nIf this was NOT you, change your password immediately at: ${settingsUrl}\n\n- The FreeTalk Security Team`;

    const html = buildEditorialEmailHtml({
      title: subject,
      preheader: `A successful login to ${email} was detected on ${formattedDate}.`,
      headline: "Successful Sign-In Detected",
      contentHtml,
      ctaText: "Review Account Security",
      ctaLink: settingsUrl
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    const logEntry = {
      type: 'LOGIN',
      to,
      subject,
      timestamp: new Date().toISOString(),
      messageId: info.messageId || 'dev-stream'
    };
    dispatchedEmailsLog.unshift(logEntry);
    if (dispatchedEmailsLog.length > 50) dispatchedEmailsLog.pop();

    console.log(`[EmailService] 📧 Login security email sent to: ${to} at ${formattedDate}`);
    return { success: true, info };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send login email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a 6-digit OTP verification code email to the user.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.code - 6-digit OTP code
 * @param {string} options.purpose - 'LOGIN' or 'REGISTER'
 */
export async function sendOtpEmail({ to, code, purpose = 'LOGIN' }) {
  try {
    const isRegister = purpose === 'REGISTER';
    const subject = isRegister
      ? 'FreeTalk — Verify Your Email to Complete Registration'
      : 'FreeTalk — Your Login Verification Code';

    const headline = isRegister ? 'Complete Your Registration' : 'Verify Your Identity';
    const actionLabel = isRegister ? 'registration' : 'sign-in';

    const contentHtml = `
      <p style="margin-top: 0;">Hello,</p>
      <p>You requested a verification code to complete your ${actionLabel} on <strong>FreeTalk</strong>. Use the code below:</p>

      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background: #FAF0EC; border: 2px solid #C45A3C; border-radius: 12px; padding: 20px 40px;">
          <div style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #C45A3C;">${code}</div>
          <div style="font-size: 12px; color: #888888; margin-top: 8px; font-style: italic;">Expires in 10 minutes</div>
        </div>
      </div>

      <div class="card-box">
        <div class="card-row">
          <span class="card-label">Account Email</span>
          <span class="card-value">${to}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Code Validity</span>
          <span class="card-value">10 minutes only</span>
        </div>
        <div class="card-row">
          <span class="card-label">Single Use</span>
          <span class="card-value">✓ Invalidated after use</span>
        </div>
      </div>

      <p style="color: #C45A3C; font-weight: 500;">⚠️ Never share this code with anyone. FreeTalk staff will never ask for it.</p>
      <p style="color: #555555; font-size: 13px;">If you did not request this code, you can safely ignore this email — your account remains secure.</p>
    `;

    const text = `FreeTalk Verification Code\n\nYour ${actionLabel} verification code is: ${code}\n\nThis code expires in 10 minutes and is single-use.\nDo NOT share this code with anyone.\n\nIf you did not request this, please ignore this email.\n\n- The FreeTalk Security Team`;

    const html = buildEditorialEmailHtml({
      title: subject,
      preheader: `Your FreeTalk verification code is: ${code} — expires in 10 minutes.`,
      headline,
      contentHtml,
      ctaText: null,
      ctaLink: null
    });

    const sendPromise = transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP timeout: network took longer than 15 seconds.')), 15000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);

    const logEntry = {
      type: 'OTP',
      to,
      subject,
      code,
      purpose,
      timestamp: new Date().toISOString(),
      messageId: info.messageId || 'dev-stream'
    };
    dispatchedEmailsLog.unshift(logEntry);
    if (dispatchedEmailsLog.length > 50) dispatchedEmailsLog.pop();

    console.log(`[EmailService] 🔐 OTP email sent from: ${EMAIL_FROM} -> TO: ${to} | Delivered to: ${JSON.stringify(info?.accepted)} | Code: ${code}`);
    return { success: true, info, code };
  } catch (err) {
    console.error(`[EmailService Error] Failed to send OTP email to ${to}:`, err.message);
    return { success: false, error: err.message, code };
  }
}

/**
 * Returns recent dispatched email logs (useful for verification and admin inspection).
 */
export function getDispatchedEmails() {
  return [...dispatchedEmailsLog];
}
