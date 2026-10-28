import nodemailer from 'nodemailer';

export function getTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });
}

export async function sendOtpEmail(email: string, otp: string, type: 'signup' | 'forgot_password' = 'signup') {
  const isSignup = type === 'signup';
  const subject = isSignup ? `${otp} is your APKify Builder Verification Code` : `${otp} is your APKify Password Reset Code`;
  const heading = isSignup ? 'Verify Your Account' : 'Reset Your Password';
  const description = isSignup 
    ? 'Welcome to APKify Builder! Please use the following 6-digit verification code to complete your registration.'
    : 'We received a request to reset your password. Use the following 6-digit code to set a new password.';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f8fafc; }
        .container { max-width: 520px; margin: 30px auto; background: #151a28; border: 1px solid #1e293b; border-radius: 16px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .logo-badge { display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff; font-weight: 800; font-size: 18px; padding: 8px 16px; border-radius: 10px; margin-bottom: 24px; text-decoration: none; }
        h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0; }
        .otp-box { background: #0f1422; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; margin: 0; }
        .expiry-note { font-size: 12px; color: #64748b; margin-top: 8px; margin-bottom: 0; }
        .footer { border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div style="text-align: center;">
          <div class="logo-badge">APKify Builder</div>
        </div>
        <h1>${heading}</h1>
        <p>${description}</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <p class="expiry-note">⏱️ This code expires in 10 minutes.</p>
        </div>
        <p>If you did not request this code, you can safely ignore this email.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} APKify Builder Inc. All rights reserved.<br/>
          Automated 24/7 Android APK Cloud Engine
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (!transporter) {
    console.log('\n======================================================');
    console.log(`[NODEMAILER DEV LOG] EMAIL_USER / EMAIL_PASS not set.`);
    console.log(`[NODEMAILER DEV LOG] Simulated ${type.toUpperCase()} OTP for ${email}:`);
    console.log(`>>> OTP: [ ${otp} ] <<<`);
    console.log('======================================================\n');
    return { success: true, simulated: true };
  }

  const mailOptions = {
    from: `"APKify Builder" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[NODEMAILER] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}
