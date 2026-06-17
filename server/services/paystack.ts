import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const TERMINAL_ID = "vt_emuiojuu";

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
    id: number;
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

export async function submitOtp(otp: string, reference: string): Promise<any> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/charge/submit_otp`,
    { otp, reference },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    },
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

// Fetch Paystack's internal numeric transaction ID for a given reference.
// Works for pending (initialised but not yet paid) transactions.
export async function getPaystackTransactionId(reference: string): Promise<number> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: { Authorization: `Bearer ${getPaystackKey()}` },
    }
  );
  const id = response.data?.data?.id;
  if (!id) throw new Error(`Cannot get Paystack transaction ID for reference: ${reference}`);
  return id as number;
}

// Push a payment event to a Paystack Terminal device.
export async function sendTerminalEvent(
  terminalId: string,
  paystackTransactionId: number
): Promise<{ eventId: string }> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/terminal/${terminalId}/event`,
    {
      type: "transaction",
      action: "process",
      data: { id: paystackTransactionId },
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  const eventId = String(response.data?.data?.id ?? "");
  return { eventId };
}

// Check the processing status of a terminal event.
// Possible statuses: "pending" | "processing" | "processed"
export async function getTerminalEventStatus(
  terminalId: string,
  eventId: string
): Promise<{ status: string }> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/terminal/${terminalId}/event/${eventId}`,
    {
      headers: { Authorization: `Bearer ${getPaystackKey()}` },
    }
  );
  return { status: response.data?.data?.status ?? "pending" };
}
