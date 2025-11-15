import nodemailer from "nodemailer";
import axios from "axios";

const EMAIL_USER = process.env.EMAILUSER || process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAILPASSWORD || process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || "mail.privateemail.com";
const EMAIL_PORT = process.env.EMAIL_PORT || "587";
const SMS_API_KEY = process.env.SMSAPI || process.env.SMS_API_KEY;
const SMS_API_URL = process.env.SMS_API_URL || "https://sms.arkesel.com/api/v2/sms/send";
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "ALLTEK";

const WAEC_URL = "https://waecdirect.org";

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: parseInt(EMAIL_PORT),
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
});

export async function sendVoucherEmail(
  email: string,
  serial: string,
  pin: string,
  examType: string
): Promise<void> {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log("Email not configured. Would send:", { email, serial, pin, examType });
    return;
  }

  const mailOptions = {
    from: `WAEC Voucher <${EMAIL_USER}>`,
    to: email,
    subject: "Your WAEC Voucher - Check Results Now",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your WAEC Voucher</h2>
        <p>Thank you for your purchase! Here are your voucher details:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Serial Number:</strong> ${serial}</p>
          <p style="margin: 10px 0;"><strong>PIN:</strong> ${pin}</p>
          <p style="margin: 10px 0;"><strong>Exam Type:</strong> ${examType}</p>
        </div>
        
        <p>Check your results here: <a href="${WAEC_URL}" style="color: #2563eb;">${WAEC_URL}</a></p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Keep these details safe. You will need them to check your WAEC results.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Need help? Contact info@alltekse.com
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendVoucherSMS(
  phone: string,
  serial: string,
  pin: string
): Promise<void> {
  const message = `WAEC Voucher - Serial: ${serial}, PIN: ${pin}. Check results: ${WAEC_URL}`;

  if (!SMS_API_KEY) {
    console.log("SMS API not configured. Would send:", { phone, message });
    return;
  }

  try {
    await axios.post(
      SMS_API_URL,
      {
        sender: SMS_SENDER_ID,
        recipients: [phone],
        message: message,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": SMS_API_KEY,
        },
      }
    );
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}
