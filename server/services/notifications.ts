import nodemailer from "nodemailer";
import axios from "axios";

const EMAIL_USER = process.env.EMAILUSER || process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAILPASSWORD || process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST || "mail.privateemail.com";
const EMAIL_PORT = process.env.EMAIL_PORT || "587";
const NALO_API_KEY = process.env.NALO_SMS_API_KEY;
const NALO_SENDER_ID = process.env.NALO_SENDER_ID || "https";
const NALO_API_URL = "https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo/send-message/";

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

export interface VoucherItem {
  serial: string;
  pin: string;
}

export async function sendVoucherEmail(
  email: string | null | undefined,
  vouchers: VoucherItem[],
  examType: string
): Promise<void> {
  if (!email || email.trim() === '') {
    console.log("No email provided, skipping email notification");
    return;
  }

  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log("Email not configured. Would send:", { email, vouchers, examType });
    return;
  }

  const portalUrl = PORTAL_URLS[examType];
  const qty = vouchers.length;
  const subject = qty > 1
    ? `Your ${qty} x ${examType} Vouchers from AllTekSE`
    : `Your ${examType} Voucher from AllTekSE`;

  const voucherRows = vouchers.map((v, i) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 10px 12px; font-weight: bold; color: #6b7280;">${qty > 1 ? `Voucher ${i + 1}` : "Serial"}</td>
      <td style="padding: 10px 12px; font-family: monospace; font-size: 15px; font-weight: bold; color: #111827;">${v.serial}</td>
      <td style="padding: 10px 12px; font-family: monospace; font-size: 15px; font-weight: bold; color: #7c3aed;">${v.pin}</td>
    </tr>`).join("");

  const portalSection = portalUrl
    ? `<p style="margin-top:16px;">Check your results here: <a href="${portalUrl}" style="color: #2563eb; font-weight: bold;">${examType} Portal</a></p>
       <p style="color: #4b5563; font-size: 14px;">${portalUrl}</p>`
    : '';

  const mailOptions = {
    from: `AllTekSE e-Voucher <${EMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">${subject}</h2>
        <p>Thank you for your purchase! Here are your voucher details:</p>

        <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden; margin: 20px 0;">
          <thead>
            <tr style="background: #7c3aed; color: white;">
              <th style="padding: 10px 12px; text-align: left;">#</th>
              <th style="padding: 10px 12px; text-align: left;">Serial Number</th>
              <th style="padding: 10px 12px; text-align: left;">PIN</th>
            </tr>
          </thead>
          <tbody>${voucherRows}</tbody>
        </table>

        <p><strong>Card Type:</strong> ${examType}</p>
        ${portalSection}

        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Keep these details safe.</p>
        <p style="color: #6b7280; font-size: 14px;">Need help? Contact support@alltekse.com or WhatsApp 0593260440</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendVoucherSMS(
  phone: string,
  vouchers: VoucherItem[],
  examType: string
): Promise<void> {
  const portalUrl = PORTAL_URLS[examType];

  let message: string;
  if (vouchers.length === 1) {
    const v = vouchers[0];
    message = portalUrl
      ? `${examType} Voucher - Serial: ${v.serial}, PIN: ${v.pin}. Check results: ${portalUrl}`
      : `${examType} Voucher - Serial: ${v.serial}, PIN: ${v.pin}. From AllTekSE e-Voucher.`;
  } else {
    const lines = vouchers.map((v, i) => `#${i + 1} Serial:${v.serial} PIN:${v.pin}`).join(" | ");
    message = portalUrl
      ? `${examType} Vouchers (${vouchers.length}): ${lines}. Check results: ${portalUrl}`
      : `${examType} Vouchers (${vouchers.length}): ${lines}. AllTekSE e-Voucher.`;
  }

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
