// services/emailService.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Obong University Radio <noreply@lovohcreate.com>";

export const sendEmail = async ({ to, subject, html }) => {
  const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message || "Failed to send email");
  }
  return data;
};

export const sendOtpEmail = async (to, otp, name = "") => {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Top Yellow Accent Bar -->
      <div style="background-color: #EAB308; height: 6px; width: 100%;"></div>

      <div style="padding: 32px;">
        <h2 style="margin: 0 0 8px; color: #18181b; font-size: 22px;">Hi${name ? " " + name : ""} 👋</h2>
        <p style="color: #52525b; font-size: 15px; line-height: 1.5; margin: 0 0 24px;">
          Here is your one-time verification code for <strong>Obong University Radio</strong>:
        </p>
        
        <!-- OTP Box -->
        <div style="font-size: 36px; letter-spacing: 12px; font-weight: 700; background: #fafafa; border: 1px dashed #d4d4d8; padding: 24px; text-align: center; border-radius: 12px; color: #18181b; margin: 0 auto; max-width: 300px;">
          ${otp}
        </div>
        
        <p style="margin: 24px 0 0; color: #52525b; font-size: 14px; line-height: 1.5;">
          This code expires in <strong>10 minutes</strong>. Never share it with anyone.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0 24px;" />
        
        <p style="color: #a1a1aa; font-size: 12px; margin: 0; line-height: 1.5;">
          If you didn’t request this code, you can safely ignore this email.<br />
          &copy; ${new Date().getFullYear()} Obong University Radio. All rights reserved.
        </p>
      </div>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: "Your Verification Code — Obong University Radio",
    html,
  });
};