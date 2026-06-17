import axios from "axios";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const TERMINAL_ID = "vt_emuiojuu";

function getPaystackKey(): string {
  const key = process.env.PAYSTACKSECRETKEYbright || process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
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

// ─── Customer ─────────────────────────────────────────────────────────────────

// Creates a Paystack customer (used as prerequisite for payment requests).
// Paystack allows multiple customers with the same email, so no dedup needed.
export async function createPaystackCustomer(email: string, phone: string): Promise<string> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/customer`,
    { email, phone },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  const code = response.data?.data?.customer_code as string;
  if (!code) throw new Error("Failed to create Paystack customer");
  return code;
}

// ─── Payment Request (Invoice) ─────────────────────────────────────────────

export interface PaymentRequestResult {
  id: number;
  offline_reference: string;
  request_code: string;
}

// Creates a Paystack payment request (invoice) for terminal processing.
// Returns the invoice id and offline_reference needed to push to terminal.
export async function createPaymentRequest(
  customerCode: string,
  description: string,
  amountInPesewas: number,
  metadata: any
): Promise<PaymentRequestResult> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/paymentrequest`,
    {
      customer: customerCode,
      description,
      amount: amountInPesewas,
      currency: "GHS",
      send_notification: false,
      draft: false,
      metadata,
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = response.data?.data;
  if (!data?.id) throw new Error("Failed to create Paystack payment request");
  return {
    id: data.id as number,
    offline_reference: String(data.offline_reference ?? data.id),
    request_code: data.request_code ?? "",
  };
}

// ─── Terminal ─────────────────────────────────────────────────────────────────

// Pushes an invoice payment request to the Paystack Terminal.
export async function sendTerminalEvent(
  terminalId: string,
  invoiceId: number,
  offlineReference: string | number
): Promise<{ eventId: string }> {
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/terminal/${terminalId}/event`,
    {
      type: "invoice",
      action: "process",
      data: { id: invoiceId, reference: offlineReference },
    },
    {
      headers: {
        Authorization: `Bearer ${getPaystackKey()}`,
        "Content-Type": "application/json",
      },
    }
  );
  return { eventId: String(response.data?.data?.id ?? "") };
}

// Checks whether the terminal received an event.
// Statuses: "pending" | "processing" | "processed"
export async function getTerminalEventStatus(
  terminalId: string,
  eventId: string
): Promise<{ status: string }> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/terminal/${terminalId}/event/${eventId}`,
    { headers: { Authorization: `Bearer ${getPaystackKey()}` } }
  );
  return { status: response.data?.data?.status ?? "pending" };
}

// ─── Verify (kept for backward-compat) ────────────────────────────────────────

export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${getPaystackKey()}` } }
  );
  return response.data;
}

// ─── Legacy / USSD helpers (kept) ─────────────────────────────────────────────

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
