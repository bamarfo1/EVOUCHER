import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getPaystackKey(): string {
  const key = process.env.PAYSTACKSECRETKEYbright || process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error("PAYSTACK_SECRET_KEY is not set");
  }
  return key;
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    customer: {
      email: string;
    };
  };
}

export async function initializePayment(
  email: string,
  amount: number, // amount MUST already be in kobo
  reference: string,
  metadata: any,
  callbackUrl: string
): Promise<PaystackInitializeResponse> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      email,
      amount, // ✅ already in kobo
      reference,
      metadata,
      callback_url: callbackUrl,
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
      },
    }
  );

  return response.data;
}

export async function chargeDirectMobileMoney(
  phone: string,
  amountInPesewas: number,
  email: string,
  reference: string,
  metadata: any,
  provider: string,
): Promise<any> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/charge`,
    {
      email,
      amount: amountInPesewas,
      currency: "GHS",
      reference,
      mobile_money: { phone, provider },
      metadata,
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
}