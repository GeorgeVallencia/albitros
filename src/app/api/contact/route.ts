import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  company: z.string().optional(),
  interest: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate the request body
    const { name, email, company, interest, message } = contactSchema.parse(body);

    // Store the contact submission in the database
    const contactSubmission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        company: company || null,
        interest: interest || null,
        message,
        status: "PENDING",
      },
    });

    // Send email notification (you'll need to configure email service)
    await sendEmailNotification({
      name,
      email,
      company,
      interest,
      message,
      submissionId: contactSubmission.id,
    });

    return NextResponse.json({
      success: true,
      message: "Contact form submitted successfully",
      id: contactSubmission.id,
    });
  } catch (error) {
    console.error("Contact form error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}

// Email notification function
async function sendEmailNotification({
  name,
  email,
  company,
  interest,
  message,
  submissionId,
}: {
  name: string;
  email: string;
  company?: string;
  interest?: string;
  message: string;
  submissionId: string;
}) {
  try {
    const nodemailer = require('nodemailer');

    // Create a transporter using Gmail SMTP (you'll need to configure this)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER, // your email address
        pass: process.env.SMTP_PASS, // your email password or app password
      },
    });

    // Email to you (the admin)
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || 'your-email@example.com', // Your email
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Submission ID:</strong> ${submissionId}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Interest:</strong> ${interest || 'Not specified'}</p>
        <hr>
        <h3>Message:</h3>
        <p>${message}</p>
        <hr>
        <p><small>Submitted on: ${new Date().toLocaleString()}</small></p>
      `,
    });

    // Confirmation email to the user
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Thank you for contacting Albitros',
      html: `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
        <p>Best regards,<br>The Albitros Team</p>
      `,
    });

    console.log('Emails sent successfully for submission:', submissionId);
  } catch (error) {
    console.error('Failed to send emails:', error);
    // Don't throw error - the form submission should still succeed even if email fails
  }
}
