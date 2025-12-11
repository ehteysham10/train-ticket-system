


import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // MUST be false for Gmail TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail app password only
  },
  tls: {
    rejectUnauthorized: false, // Prevent Gmail from blocking localhost
  },
});

// Log SMTP status
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP ERROR:", error);
  } else {
    console.log("✅ SMTP Ready to send emails");
  }
});

export default async function sendEmail(to, subject, html) {
  console.log("\n📤 Sending email to:", to);
  console.log("📨 Subject:", subject);

  const info = await transporter.sendMail({
    from: `"Railway App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("✅ Email sent:", info.messageId);
  return info;
}
