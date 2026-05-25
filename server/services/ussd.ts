import { storage } from "../storage";
import { chargeDirectMobileMoney } from "./paystack";
import { randomBytes } from "crypto";

export interface UssdResult {
  msg: string;
  isEnd: boolean; // false = END (MSGTYPE: false), true = CON (MSGTYPE: true)
}

interface UssdSession {
  step: string;
  examType: string | null;
  displayName: string | null;
  price: number | null;
  msisdn: string;
  payPhone: string | null;
  createdAt: number;
}

// Session keyed by MSISDN — Nalo uses the phone number to track sessions
const sessions = new Map<string, UssdSession>();

// Clean up sessions older than 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > 5 * 60 * 1000) {
      sessions.delete(id);
    }
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
  msgtype: boolean, // true = new/initial, false = subsequent response
): Promise<UssdResult> {
  const isNew = msgtype === true;
  let session = sessions.get(msisdn);

  // ── New session ─────────────────────────────────────────────────────────────
  if (isNew || !session) {
    // Clear any existing session for this number on a fresh dial
    sessions.delete(msisdn);
    session = {
      step: "main",
      examType: null,
      displayName: null,
      price: null,
      msisdn,
      payPhone: null,
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
      const becePrice = cardTypes.find((c) => c.examType === "BECE")?.price ?? 20;
      const wasscePrice = cardTypes.find((c) => c.examType === "WASSCE")?.price ?? 20;

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
      return end("This service is coming soon.\nDial *920*919# to try again.");
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
      const price = cardTypes.find((c) => c.examType === selected.examType)?.price ?? 20;

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

        const transaction = await storage.createTransaction({
          email: null,
          phone: session.payPhone!,
          examType: session.examType!,
          amount: String(session.price!),
          paystackReference: reference,
          quantity: 1,
          vendorId: null,
        });

        const provider = detectNetwork(session.payPhone!);
        const chargeResp = await chargeDirectMobileMoney(
          intlPhone,
          session.price! * 100,
          emailPlaceholder,
          reference,
          {
            transactionId: transaction.id,
            examType: session.examType,
            phone: session.payPhone,
            quantity: 1,
            channel: "ussd",
          },
          provider,
        );

        // Paystack returns data.status = "pay_offline"|"pending"|"success"|"failed"
        const chargeStatus = chargeResp?.data?.status;
        console.log("[USSD] Paystack charge response:", JSON.stringify({ chargeStatus, chargeResp }));

        if (chargeStatus === "failed") {
          const reason = chargeResp?.data?.gateway_response || "Payment declined by network";
          console.error("[USSD] Charge failed:", reason);
          return end(`Payment failed: ${reason}\nTry again or visit allteksevoucher.store`);
        }

        return end("Payment initiated!\nCheck your phone for MoMo prompt.\nApprove to get voucher via SMS.");
      } catch (error: any) {
        const psError = error?.response?.data?.message || error?.response?.data?.data?.message || error?.message || "Unknown error";
        console.error("[USSD] Payment error:", psError, JSON.stringify(error?.response?.data || {}));
        return end(`Payment failed: ${psError}\nVisit allteksevoucher.store`);
      }
    } else if (input === "2") {
      sessions.delete(msisdn);
      return end("Purchase cancelled.\nDial *920*919# to try again.");
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
