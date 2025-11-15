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
  getAvailableVoucher(): Promise<VoucherCard | undefined>;
  getVoucherById(id: string): Promise<VoucherCard | undefined>;
  markVoucherAsUsed(id: string, phone: string, email: string, examType: string): Promise<VoucherCard>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: string, status: string, voucherCardId?: string): Promise<Transaction>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
}

export class DbStorage implements IStorage {
  async getAvailableVoucher(): Promise<VoucherCard | undefined> {
    const [voucher] = await db
      .select()
      .from(voucherCards)
      .where(eq(voucherCards.used, false))
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

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
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

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }
}

export const storage = new DbStorage();
