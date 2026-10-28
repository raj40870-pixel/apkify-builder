import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kamaljit444501@gmail.com',
    pass: 'rftdeffrubompzni'
  }
});

async function main() {
  console.log('Verifying SMTP connection with Gmail...');
  await transporter.verify();
  console.log('✅ SMTP Connection verified successfully!');

  console.log('Sending real test OTP email to kamaljit444501@gmail.com...');
  const info = await transporter.sendMail({
    from: '"APKify Builder" <kamaljit444501@gmail.com>',
    to: 'kamaljit444501@gmail.com',
    subject: '739201 is your APKify Builder Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; background: #0b0f19; color: #fff; padding: 30px; border-radius: 12px; max-width: 500px; margin: auto;">
        <h2 style="color: #00f2fe; margin-top: 0;">APKify Builder</h2>
        <h3>Verify Your Account</h3>
        <p style="color: #94a3b8;">Use this 6-digit code to complete your registration:</p>
        <div style="background: #151a28; border: 2px dashed #6366f1; padding: 15px; text-align: center; border-radius: 8px;">
          <h1 style="color: #38bdf8; letter-spacing: 8px; margin: 0; font-size: 32px;">739201</h1>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 20px;">⏱️ This code expires in 10 minutes.</p>
      </div>
    `
  });
  console.log('✅ Email sent successfully! Message ID:', info.messageId);
}

main().catch(err => console.error('❌ Error sending mail:', err));
