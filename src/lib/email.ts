import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, any>;
  html?: string;
  text?: string;
}

// Create transporter (configure with your email service)
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
const templates = {
  'password-reset': (data: any) => ({
    subject: 'Reset your Albitros password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Albitros</h1>
            <p>Healthcare Fraud Detection Platform</p>
          </div>
          <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${data.username},</p>
            <p>We received a request to reset your password. Click the button below to reset it:</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in ${data.expiryHours} hour(s).</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Albitros. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset your Albitros password
      
      Hi ${data.username},
      
      We received a request to reset your password. Visit this link to reset it:
      ${data.resetUrl}
      
      This link will expire in ${data.expiryHours} hour(s).
      
      If you didn't request this password reset, please ignore this email.
      
      © 2024 Albitros. All rights reserved.
    `
  }),

  'email-verification': (data: any) => ({
    subject: 'Verify your Albitros account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .button { display: inline-block; background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Albitros</h1>
            <p>Healthcare Fraud Detection Platform</p>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Hi ${data.username},</p>
            <p>Thank you for signing up! Please click the button below to verify your email address:</p>
            <a href="${data.verificationUrl}" class="button">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Albitros. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify your Albitros account
      
      Hi ${data.username},
      
      Thank you for signing up! Please visit this link to verify your email address:
      ${data.verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
      
      © 2024 Albitros. All rights reserved.
    `
  }),

  'mfa-setup': (data: any) => ({
    subject: 'Set up Multi-Factor Authentication',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>MFA Setup</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .code { font-size: 24px; font-weight: bold; text-align: center; padding: 20px; background: #fff; border: 2px solid #000; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Albitros</h1>
            <p>Healthcare Fraud Detection Platform</p>
          </div>
          <div class="content">
            <h2>Multi-Factor Authentication</h2>
            <p>Hi ${data.username},</p>
            <p>Use this verification code to complete your MFA setup:</p>
            <div class="code">${data.code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please secure your account immediately.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Albitros. All rights reserved.</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Multi-Factor Authentication Setup
      
      Hi ${data.username},
      
      Use this verification code to complete your MFA setup:
      ${data.code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this, please secure your account immediately.
      
      © 2024 Albitros. All rights reserved.
    `
  })
};

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = createTransporter();

    let emailContent;

    if (options.template && templates[options.template as keyof typeof templates]) {
      emailContent = templates[options.template as keyof typeof templates](options.data || {});
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html,
        text: options.text
      };
    }

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@albitros.com',
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

// Test email configuration
export async function testEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}
