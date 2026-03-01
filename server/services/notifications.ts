import nodemailer from "nodemailer";
import axios from "axios";

const EMAIL_USER = process.env.EMAILUSER || process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAILPASSWORD || process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || "mail.privateemail.com";
const EMAIL_PORT = process.env.EMAIL_PORT || "587";
const NALO_API_KEY = process.env.NALO_SMS_API_KEY;
const NALO_SENDER_ID = process.env.NALO_SENDER_ID || "AllTekSE";
const NALO_API_URL = "https://sms.nalosolutions.com/smsbackend/clientapi/Reloaded";

const PORTAL_URLS: Record<string, string> = {
  "BECE": "https://eresults.waecgh.org",
  "WASSCE": "https://ghana.waecdirect.org",
};

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
  email: string | null | undefined,
  serial: string,
  pin: string,
  examType: string
): Promise<void> {
  if (!email || email.trim() === '') {
    console.log("No email provided, skipping email notification");
    return;
  }
  
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log("Email not configured. Would send:", { email, serial, pin, examType });
    return;
  }

  const portalUrl = PORTAL_URLS[examType];
  const portalName = portalUrl ? `${examType} Portal` : null;

  const portalSection = portalUrl
    ? `<p>Check your results here: <a href="${portalUrl}" style="color: #2563eb; font-weight: bold;">${portalName}</a></p>
       <p style="color: #4b5563; font-size: 14px;">${portalUrl}</p>`
    : '';

  const mailOptions = {
    from: `AllTekSE e-Voucher <${EMAIL_USER}>`,
    to: email,
    subject: `Your ${examType} Voucher from AllTekSE`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Your ${examType} Voucher</h2>
        <p>Thank you for your purchase! Here are your voucher details:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Serial Number:</strong> ${serial}</p>
          <p style="margin: 10px 0;"><strong>PIN:</strong> ${pin}</p>
          <p style="margin: 10px 0;"><strong>Card Type:</strong> ${examType}</p>
        </div>
        
        ${portalSection}
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          Keep these details safe.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Need help? Contact support@alltekse.com or WhatsApp 0593260440
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendVoucherSMS(
  phone: string,
  serial: string,
  pin: string,
  examType: string
): Promise<void> {
  const portalUrl = PORTAL_URLS[examType];
  const message = portalUrl
    ? `${examType} Voucher - Serial: ${serial}, PIN: ${pin}. Check results: ${portalUrl}`
    : `${examType} Voucher - Serial: ${serial}, PIN: ${pin}. From AllTekSE e-Voucher.`;

  if (!NALO_API_KEY) {
    console.log("Nalo SMS API not configured. Would send:", { phone, message });
    return;
  }

  try {
    const response = await axios.get(NALO_API_URL, {
      params: {
        key: NALO_API_KEY,
        type: 0,
        destination: phone,
        dlr: 1,
        source: NALO_SENDER_ID,
        message: message,
      },
    });

    const responseData = response.data;
    const status = responseData?.status || responseData;

    if (status === 1701 || status === "1701") {
      console.log("SMS sent successfully to", phone);
    } else if (status === 1702 || status === "1702") {
      throw new Error("Invalid URL or missing/invalid parameters");
    } else if (status === 1703 || status === "1703") {
      throw new Error("Invalid API key");
    } else if (status === 1704 || status === "1704") {
      throw new Error("Insufficient SMS credit");
    } else if (status === 1705 || status === "1705") {
      throw new Error(`Invalid Sender ID: ${NALO_SENDER_ID}`);
    } else if (status === 1706 || status === "1706") {
      throw new Error(`Invalid phone number: ${phone}`);
    } else {
      console.log("Nalo SMS API response:", responseData);
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw error;
  }
}
