import { storage } from "../storage";
import { initializePayment, getPaystackTransactionId, sendTerminalEvent, TERMINAL_ID, submitOtp } from "./paystack";
import { randomBytes } from "crypto";

export interface UssdResult {
  msg: string;
  isEnd: boolean; // true = CON (continue), false = END
}

interface UssdSession {
  step: string;
  examType: string | null;
  displayName: string | null;
  price: number | null;
  msisdn: string;
  payPhone: string | null;
  reference: string | null;
  createdAt: number;
}

// Active USSD sessions (keyed by MSISDN)
const sessions = new Map<string, UssdSession>();

// Pending OTP references — stored when Paystack returns send_otp.
// The user ends the USSD, gets an SMS code, then re-dials *920*919*[code]#
// and we auto-submit it here. Keyed by both local and international phone format.
const pendingOtps = new Map<string, { reference: string; createdAt: number }>();

// Clean up stale sessions (5 min) and pending OTPs (10 min)
setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (now - s.createdAt > 5 * 60 * 1000) sessions.delete(id);
  }
  for (const [phone, p] of pendingOtps.entries()) {
    if (now - p.createdAt > 10 * 60 * 1000) pendingOtps.delete(phone);
  }
}, 60 * 1000);

// card option 1→BECE, 2-5→WASSCE stock
const CARD_OPTIONS = [
  { examType: "BECE", displayName: "BECE" },
  { examType: "WASSCE", displayName: "WASSCE" },
  { examType: "WASSCE", displayName: "NOVDEC" },
  { examType: "WASSCE", displayName: "ABCE" },
  { examType: "WASSCE", displayName: "GBCE" },
];

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("233") && digits.length === 12) return "0" + digits.slice(3);
  if (digits.startsWith("0") && digits.length === 10) return digits;
  return raw;
}

function toInternational(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "233" + digits.slice(1);
  if (digits.startsWith("233") && digits.length === 12) return digits;
  return digits;
}

function detectNetwork(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("233") ? "0" + digits.slice(3) : digits;
  const prefix = local.slice(0, 3);
  if (["024", "025", "054", "055", "059"].includes(prefix)) return "mtn";
  if (["020", "050"].includes(prefix)) return "vod";
  if (["026", "027", "056", "057"].includes(prefix)) return "atl";
  return "mtn";
}

function isValidGhanaPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return true;
  if (digits.startsWith("233") && digits.length === 12) return true;
  return false;
}

function con(msg: string): UssdResult { return { msg, isEnd: false }; }
function end(msg: string): UssdResult { return { msg, isEnd: true }; }

export async function handleUssdRequest(
  msisdn: string,
  userdata: string,
  msgtype: boolean, // true = new/initial session
): Promise<UssdResult> {
  const isNew = msgtype === true;
  let session = sessions.get(msisdn);

  // ── OTP Redial Intercept ─────────────────────────────────────────────────────
  // When a user dials *920*919*[code]# the USERDATA arrives as the code on a
  // fresh session (MSGTYPE=true). Detect this and auto-submit the OTP.
  if (isNew) {
    const input = userdata.trim();
    const intlMsisdn = toInternational(msisdn);
    const pending = pendingOtps.get(msisdn) || pendingOtps.get(intlMsisdn);

    if (/^\d{4,8}$/.test(input) && pending) {
      // Remove the pending entry so it can't be reused
      pendingOtps.delete(msisdn);
      pendingOtps.delete(intlMsisdn);
      sessions.delete(msisdn);

      try {
        const otpResp = await submitOtp(input, pending.reference);
        const otpStatus = otpResp?.data?.status;
        console.log("[USSD] submit_otp (redial) response:", JSON.stringify({ otpStatus, otpResp }));

        if (otpStatus === "failed") {
          const reason = otpResp?.data?.gateway_response || "Code rejected";
          return end(`Payment failed: ${reason}\nTry again: *920*919#`);
        }

        return end(
          "Code accepted!\n" +
          "Payment processing.\n" +
          "Voucher sent via SMS\n" +
          "once payment confirms.",
        );
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || "OTP failed";
        console.error("[USSD] OTP redial error:", msg);
        return end(`Failed: ${msg}\nTry again: *920*919#`);
      }
    }
  }

  // ── New session ─────────────────────────────────────────────────────────────
  if (isNew || !session) {
    sessions.delete(msisdn);
    session = {
      step: "main",
      examType: null,
      displayName: null,
      price: null,
      msisdn,
      payPhone: null,
      reference: null,
      createdAt: Date.now(),
    };
    sessions.set(msisdn, session);
    return con("ALLTEKSE PORTAL\n1. Buy Voucher\n2. Buy Ticket\n3. Vote");
  }

  const input = userdata.trim();

  // ── Main Menu ───────────────────────────────────────────────────────────────
  if (session.step === "main") {
    if (input === "1") {
      const cardTypes = await storage.getAvailableCardTypes();
      const becePrice = Number(cardTypes.find((c) => c.examType === "BECE")?.price ?? 20);
      const wasscePrice = Number(cardTypes.find((c) => c.examType === "WASSCE")?.price ?? 20);

      session.step = "card";
      session.createdAt = Date.now();
      sessions.set(msisdn, session);

      return con(
        "Buy Voucher\n" +
        `1. BECE Checker-GHC${becePrice}\n` +
        `2. WASSCE-GHC${wasscePrice}\n` +
        `3. NOVDEC-GHC${wasscePrice}\n` +
        `4. ABCE-GHC${wasscePrice}\n` +
        `5. GBCE-GHC${wasscePrice}`,
      );
    } else if (input === "2" || input === "3") {
      sessions.delete(msisdn);
      return end("Coming soon.\nDial *920*919# to try again.\nWeb: allteksevoucher.store");
    } else {
      return con("ALLTEKSE PORTAL\n1. Buy Voucher\n2. Buy Ticket\n3. Vote\n\nInvalid choice.");
    }
  }

  // ── Card Menu ───────────────────────────────────────────────────────────────
  if (session.step === "card") {
    const choice = parseInt(input);
    if (choice >= 1 && choice <= 5) {
      const selected = CARD_OPTIONS[choice - 1];

      const count = await storage.getAvailableVoucherCount(selected.examType);
      if (count === 0) {
        sessions.delete(msisdn);
        return end(`${selected.displayName} vouchers are out of stock.\nTry again later.`);
      }

      const cardTypes = await storage.getAvailableCardTypes();
      const price = Number(cardTypes.find((c) => c.examType === selected.examType)?.price ?? 20);

      session.examType = selected.examType;
      session.displayName = selected.displayName;
      session.price = price;
      session.step = "phone_choice";
      session.createdAt = Date.now();
      sessions.set(msisdn, session);

      const displayMsisdn = formatPhone(msisdn);
      return con(
        `${selected.displayName}-GHC${price}\n` +
        `Charge number:\n${displayMsisdn}\n` +
        `1. Use this number\n` +
        `2. Enter different number`,
      );
    } else {
      return con("Buy Voucher\n1. BECE\n2. WASSCE\n3. NOVDEC\n4. ABCE\n5. GBCE\n\nInvalid choice.");
    }
  }

  // ── Phone Choice ────────────────────────────────────────────────────────────
  if (session.step === "phone_choice") {
    if (input === "1") {
      session.payPhone = formatPhone(msisdn);
      session.step = "confirm";
      session.createdAt = Date.now();
      sessions.set(msisdn, session);
      return con(
        "Confirm Payment\n" +
        `${session.displayName}: GHC${session.price}\n` +
        `MoMo: ${session.payPhone}\n` +
        `1. Confirm & Pay\n` +
        `2. Cancel`,
      );
    } else if (input === "2") {
      session.step = "enter_phone";
      session.createdAt = Date.now();
      sessions.set(msisdn, session);
      return con("Enter your MoMo number:");
    } else {
      const displayMsisdn = formatPhone(msisdn);
      return con(
        `Charge number:\n${displayMsisdn}\n` +
        `1. Use this number\n` +
        `2. Enter different number\n\nInvalid choice.`,
      );
    }
  }

  // ── Enter Phone ─────────────────────────────────────────────────────────────
  if (session.step === "enter_phone") {
    if (!isValidGhanaPhone(input)) {
      return con("Invalid number.\nEnter MoMo number (e.g. 0244000000):");
    }
    session.payPhone = formatPhone(input);
    session.step = "confirm";
    session.createdAt = Date.now();
    sessions.set(msisdn, session);
    return con(
      "Confirm Payment\n" +
      `${session.displayName}: GHC${session.price}\n` +
      `MoMo: ${session.payPhone}\n` +
      `1. Confirm & Pay\n` +
      `2. Cancel`,
    );
  }

  // ── Confirm ─────────────────────────────────────────────────────────────────
  if (session.step === "confirm") {
    if (input === "1") {
      sessions.delete(msisdn);
      try {
        const reference = `USSD-${Date.now()}-${randomBytes(3).toString("hex")}`;
        const intlPhone = toInternational(session.payPhone!);
        const emailPlaceholder = `${intlPhone}@noemail.alltekse.com`;

        const price = Number(session.price!);
        const transaction = await storage.createTransaction({
          email: null,
          phone: session.payPhone!,
          examType: session.examType!,
          amount: String(price),
          paystackReference: reference,
          quantity: 1,
          vendorId: null,
        });

        const baseUrl = process.env.BASE_URL || "http://localhost:5000";

        // Initialize Paystack transaction
        await initializePayment(
          emailPlaceholder,
          Math.round(price * 100),
          reference,
          {
            transactionId: transaction.id,
            examType: session.examType,
            phone: session.payPhone,
            quantity: 1,
            channel: "ussd",
          },
          `${baseUrl}/payment-callback?reference=${reference}`,
        );

        // Get Paystack numeric transaction ID and push to terminal
        const paystackTxId = await getPaystackTransactionId(reference);
        await sendTerminalEvent(TERMINAL_ID, paystackTxId);

        console.log("[USSD] Payment pushed to terminal:", TERMINAL_ID, "for reference:", reference);

        return end(
          "Payment sent to terminal!\n" +
          "Proceed to the counter\n" +
          "to complete payment.\n" +
          "Voucher sent via SMS\n" +
          "once payment confirms.",
        );
      } catch (error: any) {
        const psError = error?.response?.data?.message || error?.response?.data?.data?.message || error?.message || "Unknown error";
        console.error("[USSD] Payment error:", psError, JSON.stringify(error?.response?.data || {}));
        return end(`Payment failed: ${psError}\nTry again: *920*919#`);
      }
    } else if (input === "2") {
      sessions.delete(msisdn);
      return end("Cancelled.\nDial *920*919# to try again.");
    } else {
      return con(
        "Confirm Payment\n" +
        `${session.displayName}: GHC${session.price}\n` +
        `MoMo: ${session.payPhone}\n` +
        `1. Confirm & Pay\n` +
        `2. Cancel\n\nInvalid choice.`,
      );
    }
  }

  sessions.delete(msisdn);
  return end("Session expired.\nDial *920*919# to start again.");
}
