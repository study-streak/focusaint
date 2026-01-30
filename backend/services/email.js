import nodemailer from "nodemailer"
import { getOTPEmailTemplate } from "../templates/otpEmail.js"

// Create transporter - Configure with your email service
const createTransporter = () => {
  // For Gmail (requires App Password if 2FA is enabled)
  // Go to: https://myaccount.google.com/apppasswords
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
    })
  }

  // For other SMTP services (SendGrid, Mailgun, etc.)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
}

export const sendOTP = async (email, otp, name = "") => {
  try {
    // If email credentials are not configured, just log (for development)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`\n${"=".repeat(60)}`)
      console.log(`📧 OTP EMAIL (Development Mode)`)
      console.log(`${"=".repeat(60)}`)
      console.log(`To: ${email}`)
      console.log(`Name: ${name || "User"}`)
      console.log(`OTP Code: ${otp}`)
      console.log(`Expires in: 10 minutes`)
      console.log(`${"=".repeat(60)}\n`)
      console.log(`⚠️  To enable real email sending, configure these environment variables:`)
      console.log(`   EMAIL_SERVICE=gmail (or leave empty for custom SMTP)`)
      console.log(`   EMAIL_USER=your-email@gmail.com`)
      console.log(`   EMAIL_PASSWORD=your-app-password`)
      console.log(`   SMTP_HOST=smtp.gmail.com (optional)`)
      console.log(`   SMTP_PORT=587 (optional)`)
      console.log(`${"=".repeat(60)}\n`)
      return true
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: {
        name: "focusaint",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: `Account verification code`,
      html: getOTPEmailTemplate(name, otp),
      text: `Hello ${name || "there"}!\n\nYour focusaint verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nThe focusaint Team`,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✓ OTP email sent successfully to ${email}`)
    console.log(`Message ID: ${info.messageId}`)
    return true
  } catch (error) {
    console.error("Email send error:", error)
    throw new Error("Failed to send verification email")
  }
}

