import nodemailer from "nodemailer";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env["EMAIL_USER"],
    pass: process.env["EMAIL_PASS"],
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    console.log(`Attempting to send email to ${to}...`);
    const info = await transporter.sendMail({
      from: process.env["EMAIL_FROM"],
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    if (error.code === 'EAUTH') {
      console.error("Authentication Error: Please ensure you are using an App Password if 2FA is enabled.");
    }
    return { success: false, error: error.message };
  }
}

export default transporter;
