import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env["EMAIL_HOST"],
  port: Number(process.env["EMAIL_PORT"]),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: process.env["EMAIL_FROM"],
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    // We don't throw error here to prevent blocking the main process
  }
}

export default transporter;
