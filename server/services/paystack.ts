import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getPaystackKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    customer: { email: string };
  };
}

// Initialize a standard Paystack checkout. Returns authorization_url to redirect the customer.
export async function initializePayment(
  email: string,
  amountInPesewas: number,
  reference: string,
  metadata: any,
  callbackUrl: string
): Promise<PaystackInitResponse> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      email,
      amount: amountInPesewas,
      reference,
      metadata,
      callback_url: callbackUrl,
      currency: "GHS",
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data?.data as PaystackInitResponse;
}

// Verify a completed Paystack transaction by reference.
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${getPaystackKey()}` } }
  );
  return response.data;
}

// Direct mobile money charge for Ghana (triggers STK push / network prompt).
// provider: "mtn" | "vod" | "atl"
// voucher: required for AirtelTigo (customer dials *110# to generate it)
export async function chargeMobileMoney(
  email: string,
  amountInPesewas: number,
  reference: string,
  phone: string,
  provider: string,
  metadata: any,
  voucher?: string
): Promise<{ status: string; displayText?: string }> {
  const mobileMoneyPayload: any = { phone, provider };
  if (voucher) mobileMoneyPayload.voucher = voucher;

  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/charge`,
    {
      email,
      amount: amountInPesewas,
      currency: "GHS",
      reference,
      metadata,
      mobile_money: mobileMoneyPayload,
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = response.data?.data;
  return {
    status: data?.status ?? "pending",
    displayText: data?.display_text ?? data?.message,
  };
}

// Submit OTP for card charge flows.
export async function submitOtp(otp: string, reference: string): Promise<any> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/charge/submit_otp`,
    { otp, reference },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}
