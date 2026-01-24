const nodemailer = require('nodemailer');

async function testEtherealEmail() {
  console.log('📧 Creating Ethereal test account...');

  // Create test account
  const account = await nodemailer.createTestAccount();

  console.log('✅ Ethereal Account Created:');
  console.log('   Email:', account.user);
  console.log('   Password:', account.pass);
  console.log('   SMTP Host:', account.smtp.host);
  console.log('   SMTP Port:', account.smtp.port);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  try {
    // Send test email
    const info = await transporter.sendMail({
      from: 'noreply@albitros.com',
      to: 'georgevallencia@gmail.com',
      subject: '🔗 Test Password Reset - Albitros',
      html: `
        <h2>Albitros Password Reset Test</h2>
        <p>Hi Test User,</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="http://localhost:3000/reset-password?token=test-token-12345" style="display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <br>
        <p>🎉 This is a test email using Ethereal Email service!</p>
      `,
    });

    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('🌐 Email Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('');
    console.log('👆 COPY THE URL ABOVE and paste it in your browser to view the email!');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEtherealEmail();
