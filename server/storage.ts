import { db } from "./db";
import { 
  type VoucherCard, 
  type InsertVoucherCard,
  type Transaction,
  type InsertTransaction,
  type BlogPost,
  type InsertBlogPost,
  type Vendor,
  type VendorPrice,
  voucherCards,
  transactions,
  blogPosts,
  vendors,
  vendorPrices,
} from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  getAvailableVoucher(examType?: string): Promise<VoucherCard | undefined>;
  getAvailableVoucherCount(examType: string): Promise<number>;
  getVoucherById(id: string): Promise<VoucherCard | undefined>;
  markVoucherAsUsed(id: string, phone: string, email: string | null, examType: string): Promise<VoucherCard>;
  createTransaction(transaction: Partial<InsertTransaction> & { email: string | null; phone: string; examType: string; amount: string; paystackReference: string; quantity?: number; vendorId?: string | null }): Promise<Transaction>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: string, status: string, voucherCardId?: string): Promise<Transaction>;
  updateTransactionStatusConditional(id: string, fromStatus: string, toStatus: string): Promise<Transaction | null>;
  assignVouchersToTransaction(transactionId: string, phone: string, email: string | null, examType: string, quantity: number): Promise<{ transaction: Transaction; vouchers: VoucherCard[] } | null>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getVouchersByPhoneAndDate(phone: string, date: string): Promise<{ serial: string; pin: string; examType: string }[]>;
  getAvailableCardTypes(): Promise<{ examType: string; count: number; price: number; imageUrl: string | null }[]>;
  // Vendor methods
  createVendor(data: { phone: string; passwordHash: string; storeName?: string; momoNumber: string; momoName: string; contactNumber: string; slug: string }): Promise<Vendor>;
  getVendorByPhone(phone: string): Promise<Vendor | undefined>;
  getVendorBySlug(slug: string): Promise<Vendor | undefined>;
  getVendorById(id: string): Promise<Vendor | undefined>;
  upsertVendorPrice(vendorId: string, examType: string, price: number): Promise<void>;
  getVendorPrices(vendorId: string): Promise<VendorPrice[]>;
  getVendorPrice(vendorId: string, examType: string): Promise<VendorPrice | undefined>;
  getVendorStats(vendorId: string): Promise<{ totalSales: number; totalRevenue: number; byType: { examType: string; count: number; revenue: number }[] }>;
  // Blog methods
  getBlogPosts(limit: number, offset: number): Promise<BlogPost[]>;
  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getBlogPostCount(): Promise<number>;
  // Admin methods
  adminGetCardSummary(): Promise<{ examType: string; total: number; used: number; available: number; price: number; imageUrl: string | null }[]>;
  adminGetSalesSummary(): Promise<{ totalSales: number; totalRevenue: number; byType: { examType: string; count: number; revenue: number }[] }>;
  adminGetRecentTransactions(limit: number): Promise<Transaction[]>;
  adminAddVouchers(vouchers: { serial: string; pin: string; examType: string; price: number }[]): Promise<number>;
  adminUpdateCardImage(examType: string, imageUrl: string): Promise<void>;
  adminDeleteVoucher(id: string): Promise<void>;
}

export class DbStorage implements IStorage {
  async getAvailableVoucher(examType?: string): Promise<VoucherCard | undefined> {
    const conditions = [eq(voucherCards.used, false)];
    if (examType) conditions.push(eq(voucherCards.examType, examType));
    const [voucher] = await db.select().from(voucherCards).where(and(...conditions)).limit(1);
    return voucher;
  }

  async getAvailableVoucherCount(examType: string): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(voucherCards)
      .where(and(eq(voucherCards.used, false), eq(voucherCards.examType, examType)));
    return row?.count ?? 0;
  }

  async getVoucherById(id: string): Promise<VoucherCard | undefined> {
    const [voucher] = await db.select().from(voucherCards).where(eq(voucherCards.id, id));
    return voucher;
  }

  async markVoucherAsUsed(id: string, phone: string, email: string | null, examType: string): Promise<VoucherCard> {
    const [voucher] = await db
      .update(voucherCards)
      .set({ used: true, purchaserPhone: phone, purchaserEmail: email, examType, usedAt: sql`now()` })
      .where(eq(voucherCards.id, id))
      .returning();
    return voucher;
  }

  async createTransaction(insertTransaction: Partial<InsertTransaction> & { email: string | null; phone: string; examType: string; amount: string; paystackReference: string; quantity?: number; vendorId?: string | null }): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction as any).returning();
    return transaction;
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.paystackReference, reference));
    return transaction;
  }

  async updateTransactionStatus(id: string, status: string, voucherCardId?: string): Promise<Transaction> {
    const updateData: any = { status };
    if (status === "completed") updateData.completedAt = sql`now()`;
    if (voucherCardId) updateData.voucherCardId = voucherCardId;
    const [transaction] = await db.update(transactions).set(updateData).where(eq(transactions.id, id)).returning();
    return transaction;
  }

  async updateTransactionStatusConditional(id: string, fromStatus: string, toStatus: string): Promise<Transaction | null> {
    const [transaction] = await db
      .update(transactions)
      .set({ status: toStatus })
      .where(and(eq(transactions.id, id), eq(transactions.status, fromStatus)))
      .returning();
    return transaction || null;
  }

  async assignVouchersToTransaction(transactionId: string, phone: string, email: string | null, examType: string, quantity: number): Promise<{ transaction: Transaction; vouchers: VoucherCard[] } | null> {
    return await db.transaction(async (tx) => {
      const availableVouchers = await tx
        .select()
        .from(voucherCards)
        .where(and(eq(voucherCards.used, false), eq(voucherCards.examType, examType)))
        .limit(quantity)
        .for('update');

      if (availableVouchers.length < quantity) {
        await tx.update(transactions).set({ status: "failed" }).where(eq(transactions.id, transactionId));
        return null;
      }

      const updatedVouchers: VoucherCard[] = [];
      for (const v of availableVouchers) {
        const [updated] = await tx
          .update(voucherCards)
          .set({ used: true, purchaserPhone: phone, purchaserEmail: email, usedAt: sql`now()` })
          .where(eq(voucherCards.id, v.id))
          .returning();
        updatedVouchers.push(updated);
      }

      const allIds = updatedVouchers.map(v => v.id);
      const [updatedTransaction] = await tx
        .update(transactions)
        .set({
          status: "completed",
          voucherCardId: updatedVouchers[0].id,
          voucherCardIds: allIds,
          completedAt: sql`now()`,
        })
        .where(eq(transactions.id, transactionId))
        .returning();

      return { transaction: updatedTransaction, vouchers: updatedVouchers };
    });
  }

  async assignVoucherToTransaction(transactionId: string, phone: string, email: string | null, examType: string): Promise<{ transaction: Transaction; voucher: VoucherCard } | null> {
    const result = await this.assignVouchersToTransaction(transactionId, phone, email, examType, 1);
    if (!result) return null;
    return { transaction: result.transaction, voucher: result.vouchers[0] };
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getVouchersByPhoneAndDate(phone: string, date: string): Promise<{ serial: string; pin: string; examType: string }[]> {
    const normalizedPhone = this.normalizePhone(phone);
    console.log('[Voucher Retrieval] Normalized search phone:', normalizedPhone, 'Date:', date);

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
      .orderBy(sql`${transactions.createdAt} DESC`);

    console.log('[Voucher Retrieval] Found results:', results.length);
    return results;
  }

  async getAvailableCardTypes(): Promise<{ examType: string; count: number; price: number; imageUrl: string | null }[]> {
    const results = await db
      .select({
        examType: voucherCards.examType,
        count: sql<number>`count(*)::int`,
        price: sql<number>`min(${voucherCards.price})`,
        imageUrl: sql<string | null>`max(${voucherCards.imageUrl})`,
      })
      .from(voucherCards)
      .where(eq(voucherCards.used, false))
      .groupBy(voucherCards.examType)
      .orderBy(voucherCards.examType);

    return results
      .filter((r) => r.examType !== null)
      .map((r) => ({ examType: r.examType!, count: r.count, price: r.price, imageUrl: r.imageUrl }));
  }

  // ── Vendor ────────────────────────────────────────────────────────────────

  async createVendor(data: { phone: string; passwordHash: string; storeName?: string; momoNumber: string; momoName: string; contactNumber: string; slug: string }): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values({
      phone: data.phone,
      passwordHash: data.passwordHash,
      storeName: data.storeName || null,
      momoNumber: data.momoNumber,
      momoName: data.momoName,
      contactNumber: data.contactNumber,
      slug: data.slug,
    }).returning();
    return vendor;
  }

  async getVendorByPhone(phone: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.phone, phone));
    return vendor;
  }

  async getVendorBySlug(slug: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.slug, slug));
    return vendor;
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async upsertVendorPrice(vendorId: string, examType: string, price: number): Promise<void> {
    await db
      .insert(vendorPrices)
      .values({ vendorId, examType, price })
      .onConflictDoUpdate({
        target: [vendorPrices.vendorId, vendorPrices.examType],
        set: { price },
      });
  }

  async getVendorPrices(vendorId: string): Promise<VendorPrice[]> {
    return await db.select().from(vendorPrices).where(eq(vendorPrices.vendorId, vendorId));
  }

  async getVendorPrice(vendorId: string, examType: string): Promise<VendorPrice | undefined> {
    const [price] = await db
      .select()
      .from(vendorPrices)
      .where(and(eq(vendorPrices.vendorId, vendorId), eq(vendorPrices.examType, examType)));
    return price;
  }

  async getVendorStats(vendorId: string): Promise<{ totalSales: number; totalRevenue: number; byType: { examType: string; count: number; revenue: number }[] }> {
    const [totals] = await db
      .select({
        totalSales: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${transactions.amount}::numeric), 0)::int`,
      })
      .from(transactions)
      .where(and(eq(transactions.vendorId, vendorId), eq(transactions.status, "completed")));

    const byType = await db
      .select({
        examType: transactions.examType,
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${transactions.amount}::numeric), 0)::int`,
      })
      .from(transactions)
      .where(and(eq(transactions.vendorId, vendorId), eq(transactions.status, "completed")))
      .groupBy(transactions.examType)
      .orderBy(transactions.examType);

    return { totalSales: totals?.totalSales ?? 0, totalRevenue: totals?.totalRevenue ?? 0, byType };
  }

  // ── Blog ──────────────────────────────────────────────────────────────────

  async getBlogPosts(limit: number, offset: number): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostCount(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(blogPosts);
    return row?.count ?? 0;
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async adminGetCardSummary(): Promise<{ examType: string; total: number; used: number; available: number; price: number; imageUrl: string | null }[]> {
    const results = await db
      .select({
        examType: voucherCards.examType,
        total: sql<number>`count(*)::int`,
        used: sql<number>`sum(case when ${voucherCards.used} then 1 else 0 end)::int`,
        available: sql<number>`sum(case when not ${voucherCards.used} then 1 else 0 end)::int`,
        price: sql<number>`min(${voucherCards.price})`,
        imageUrl: sql<string | null>`max(${voucherCards.imageUrl})`,
      })
      .from(voucherCards)
      .groupBy(voucherCards.examType)
      .orderBy(voucherCards.examType);
    return results.filter(r => r.examType !== null).map(r => ({
      examType: r.examType!, total: r.total, used: r.used, available: r.available, price: r.price, imageUrl: r.imageUrl,
    }));
  }

  async adminGetSalesSummary(): Promise<{ totalSales: number; totalRevenue: number; byType: { examType: string; count: number; revenue: number }[] }> {
    const [totals] = await db
      .select({
        totalSales: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${transactions.amount}::numeric), 0)::int`,
      })
      .from(transactions)
      .where(eq(transactions.status, "completed"));

    const byType = await db
      .select({
        examType: transactions.examType,
        count: sql<number>`count(*)::int`,
        revenue: sql<number>`coalesce(sum(${transactions.amount}::numeric), 0)::int`,
      })
      .from(transactions)
      .where(eq(transactions.status, "completed"))
      .groupBy(transactions.examType)
      .orderBy(transactions.examType);

    return { totalSales: totals?.totalSales ?? 0, totalRevenue: totals?.totalRevenue ?? 0, byType };
  }

  async adminGetRecentTransactions(limit: number): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(sql`${transactions.createdAt} desc`).limit(limit);
  }

  async adminAddVouchers(vouchers: { serial: string; pin: string; examType: string; price: number }[]): Promise<number> {
    if (vouchers.length === 0) return 0;
    const inserted = await db
      .insert(voucherCards)
      .values(vouchers.map(v => ({ serial: v.serial, pin: v.pin, examType: v.examType, price: v.price })))
      .onConflictDoNothing()
      .returning();
    return inserted.length;
  }

  async adminUpdateCardImage(examType: string, imageUrl: string): Promise<void> {
    await db.update(voucherCards).set({ imageUrl }).where(eq(voucherCards.examType, examType));
  }

  async adminDeleteVoucher(id: string): Promise<void> {
    await db.delete(voucherCards).where(and(eq(voucherCards.id, id), eq(voucherCards.used, false)));
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\+\-\(\)]/g, '');
    if (cleaned.startsWith('0')) cleaned = '233' + cleaned.substring(1);
    else if (!cleaned.startsWith('233')) cleaned = '233' + cleaned;
    return cleaned;
  }
}

export const storage = new DbStorage();
