const { sendEmail } = require('./src/lib/email.ts');

async function testEmail() {
  console.log('Testing new email system...');

  try {
    await sendEmail({
      to: 'georgevallencia@gmail.com',
      template: 'password-reset',
      data: {
        username: 'Test User',
        resetUrl: 'http://localhost:3000/reset-password?token=test-token-123',
        expiryHours: 1
      }
    });

    console.log('✅ Email test completed successfully!');
    console.log('📧 Check the console output above for the preview URL to view your email');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

testEmail();
