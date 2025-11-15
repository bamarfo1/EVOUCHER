import nodemailer from "nodemailer";
import axios from "axios";

const EMAIL_USER = process.env.EMAILUSER || process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAILPASSWORD || process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || "mail.privateemail.com";
const EMAIL_PORT = process.env.EMAIL_PORT || "587";
const SMS_API_KEY = process.env.SMSAPI || process.env.SMS_API_KEY;
const SMS_API_URL = process.env.SMS_API_URL || "http://clientlogin.bulksmsgh.com/smsapi";
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
          Need help? Contact support@alltekse.com
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
    const response = await axios.get(SMS_API_URL, {
      params: {
        key: SMS_API_KEY,
        to: phone,
        msg: message,
        sender_id: SMS_SENDER_ID,
      },
    });

    const responseData = response.data;
    const responseCode = responseData?.code || responseData;
    
    if (responseCode === 1000 || responseCode === "1000") {
      console.log("SMS sent successfully to", phone);
    } else if (responseCode === 1004 || responseCode === "1004") {
      throw new Error("Invalid SMS API Key");
    } else if (responseCode === 1005 || responseCode === "1005") {
      throw new Error(`Invalid phone number: ${phone}`);
    } else if (responseCode === 1006 || responseCode === "1006") {
      throw new Error(`Invalid Sender ID: ${SMS_SENDER_ID}`);
    } else if (responseCode === 1003 || responseCode === "1003") {
      throw new Error("Insufficient SMS balance");
    } else if (responseCode === 1002 || responseCode === "1002") {
      throw new Error("Message not sent");
    } else {
      console.log(`SMS API response:`, responseData);
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}
