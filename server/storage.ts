import { db } from "../db";
import { 
  type VoucherCard, 
  type InsertVoucherCard,
  type Transaction,
  type InsertTransaction,
  voucherCards,
  transactions
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  getAvailableVoucher(examType?: string): Promise<VoucherCard | undefined>;
  getVoucherById(id: string): Promise<VoucherCard | undefined>;
  markVoucherAsUsed(id: string, phone: string, email: string, examType: string): Promise<VoucherCard>;
  createTransaction(transaction: Partial<InsertTransaction> & { email: string; phone: string; examType: string; amount: string; paystackReference: string }): Promise<Transaction>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: string, status: string, voucherCardId?: string): Promise<Transaction>;
  updateTransactionStatusConditional(id: string, fromStatus: string, toStatus: string): Promise<Transaction | null>;
  assignVoucherToTransaction(transactionId: string, phone: string, email: string, examType: string): Promise<{ transaction: Transaction; voucher: VoucherCard } | null>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getVoucherByPhoneAndDate(phone: string, date: string): Promise<{ serial: string; pin: string; examType: string } | null>;
}

export class DbStorage implements IStorage {
  async getAvailableVoucher(examType?: string): Promise<VoucherCard | undefined> {
    const conditions = [eq(voucherCards.used, false)];
    
    if (examType) {
      conditions.push(eq(voucherCards.examType, examType));
    }
    
    const [voucher] = await db
      .select()
      .from(voucherCards)
      .where(and(...conditions))
      .limit(1);
    return voucher;
  }

  async getVoucherById(id: string): Promise<VoucherCard | undefined> {
    const [voucher] = await db
      .select()
      .from(voucherCards)
      .where(eq(voucherCards.id, id));
    return voucher;
  }

  async markVoucherAsUsed(
    id: string, 
    phone: string, 
    email: string, 
    examType: string
  ): Promise<VoucherCard> {
    const [voucher] = await db
      .update(voucherCards)
      .set({
        used: true,
        purchaserPhone: phone,
        purchaserEmail: email,
        examType: examType,
        usedAt: sql`now()`,
      })
      .where(eq(voucherCards.id, id))
      .returning();
    return voucher;
  }

  async createTransaction(insertTransaction: Partial<InsertTransaction> & { email: string; phone: string; examType: string; amount: string; paystackReference: string }): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction as any)
      .returning();
    return transaction;
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.paystackReference, reference));
    return transaction;
  }

  async updateTransactionStatus(
    id: string, 
    status: string, 
    voucherCardId?: string
  ): Promise<Transaction> {
    const updateData: any = {
      status,
    };
    
    if (status === "completed") {
      updateData.completedAt = sql`now()`;
    }
    
    if (voucherCardId) {
      updateData.voucherCardId = voucherCardId;
    }

    const [transaction] = await db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async updateTransactionStatusConditional(
    id: string,
    fromStatus: string,
    toStatus: string
  ): Promise<Transaction | null> {
    const [transaction] = await db
      .update(transactions)
      .set({ status: toStatus })
      .where(and(
        eq(transactions.id, id),
        eq(transactions.status, fromStatus)
      ))
      .returning();
    return transaction || null;
  }

  async assignVoucherToTransaction(
    transactionId: string,
    phone: string,
    email: string,
    examType: string
  ): Promise<{ transaction: Transaction; voucher: VoucherCard } | null> {
    return await db.transaction(async (tx) => {
      // Find available voucher card matching the exam type
      const [availableVoucher] = await tx
        .select()
        .from(voucherCards)
        .where(
          and(
            eq(voucherCards.used, false),
            eq(voucherCards.examType, examType)
          )
        )
        .limit(1)
        .for('update');

      if (!availableVoucher) {
        await tx
          .update(transactions)
          .set({ status: "failed" })
          .where(eq(transactions.id, transactionId));
        return null;
      }

      const [updatedVoucher] = await tx
        .update(voucherCards)
        .set({
          used: true,
          purchaserPhone: phone,
          purchaserEmail: email,
          usedAt: sql`now()`,
        })
        .where(eq(voucherCards.id, availableVoucher.id))
        .returning();

      const [updatedTransaction] = await tx
        .update(transactions)
        .set({
          status: "completed",
          voucherCardId: updatedVoucher.id,
          completedAt: sql`now()`,
        })
        .where(eq(transactions.id, transactionId))
        .returning();

      return {
        transaction: updatedTransaction,
        voucher: updatedVoucher,
      };
    });
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async getVoucherByPhoneAndDate(phone: string, date: string): Promise<{ serial: string; pin: string; examType: string } | null> {
    const normalizedPhone = this.normalizePhone(phone);
    console.log('[Voucher Retrieval] Normalized search phone:', normalizedPhone);
    console.log('[Voucher Retrieval] Search date:', date);
    
    // Use SQL to normalize phone numbers for comparison
    // This SQL normalizes the phone by:
    // 1. Removing spaces, +, -, (, )
    // 2. Replacing leading '0' with '233'
    // 3. Adding '233' prefix if missing
    const results = await db
      .select({
        serial: voucherCards.serial,
        pin: voucherCards.pin,
        examType: transactions.examType,
      })
      .from(transactions)
      .innerJoin(voucherCards, eq(transactions.voucherCardId, voucherCards.id))
      .where(
        and(
          eq(transactions.status, "completed"),
          sql`DATE(${transactions.createdAt}) = ${date}`,
          sql`
            CASE 
              WHEN REGEXP_REPLACE(${transactions.phone}, '[\\s\\+\\-\\(\\)]', '', 'g') ~ '^0'
              THEN '233' || SUBSTRING(REGEXP_REPLACE(${transactions.phone}, '[\\s\\+\\-\\(\\)]', '', 'g') FROM 2)
              WHEN REGEXP_REPLACE(${transactions.phone}, '[\\s\\+\\-\\(\\)]', '', 'g') ~ '^233'
              THEN REGEXP_REPLACE(${transactions.phone}, '[\\s\\+\\-\\(\\)]', '', 'g')
              ELSE '233' || REGEXP_REPLACE(${transactions.phone}, '[\\s\\+\\-\\(\\)]', '', 'g')
            END = ${normalizedPhone}
          `
        )
      )
      .orderBy(sql`${transactions.createdAt} DESC`)
      .limit(1);
    
    console.log('[Voucher Retrieval] Found results:', results.length);
    
    if (results.length === 0) {
      console.log('[Voucher Retrieval] No matching voucher found');
      return null;
    }
    
    console.log('[Voucher Retrieval] Match found!');
    return {
      serial: results[0].serial,
      pin: results[0].pin,
      examType: results[0].examType,
    };
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\+\-\(\)]/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '233' + cleaned.substring(1);
    } else if (!cleaned.startsWith('233')) {
      cleaned = '233' + cleaned;
    }
    
    return cleaned;
  }
}

export const storage = new DbStorage();
