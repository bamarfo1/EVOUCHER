import { db, pool } from "./db";
import { 
  type VoucherCard, 
  type InsertVoucherCard,
  type Transaction,
  type InsertTransaction,
  type BlogPost,
  type InsertBlogPost,
  type Vendor,
  type VendorPrice,
  type Payout,
  type WithdrawalRequest,
  voucherCards,
  transactions,
  blogPosts,
  vendors,
  vendorPrices,
  vendorBasePrices,
  payouts,
  withdrawalRequests,
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
  updateVendorStoreName(vendorId: string, storeName: string): Promise<void>;
  // Admin vendor methods
  adminGetAllVendors(): Promise<{ vendor: Vendor; totalSales: number; totalRevenue: number; pendingProfit: number; lastPayoutAt: Date | null }[]>;
  adminUpdateVendor(id: string, data: { storeName?: string; contactNumber?: string; momoNumber?: string; momoName?: string; status?: string }): Promise<Vendor>;
  adminCloseVendorForPayout(vendorId: string): Promise<Payout | null>;
  adminMarkPayoutPaid(payoutId: string): Promise<Payout>;
  adminGetVendorPayouts(vendorId: string): Promise<Payout[]>;
  adminCloseAllVendorsForPayout(): Promise<void>;
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
  adminDeleteCardType(examType: string): Promise<{ deleted: number }>;
  adminUpdateCardTypePrice(examType: string, price: number): Promise<void>;
  // Vendor base price methods (admin-configurable, separate from public price)
  getVendorBasePrices(): Promise<{ examType: string; price: number }[]>;
  getVendorBasePrice(examType: string): Promise<number | null>;
  setVendorBasePrice(examType: string, price: number): Promise<void>;
  // Withdrawal request methods
  createWithdrawalRequest(vendorId: string, amount: number, momoNumber: string, momoName: string): Promise<WithdrawalRequest>;
  getVendorWithdrawalRequests(vendorId: string): Promise<WithdrawalRequest[]>;
  getVendorPendingWithdrawalRequest(vendorId: string): Promise<WithdrawalRequest | null>;
  adminGetAllWithdrawalRequests(): Promise<(WithdrawalRequest & { vendor: Vendor })[]>;
  adminApproveWithdrawalRequest(requestId: string): Promise<void>;
  adminRejectWithdrawalRequest(requestId: string, note?: string): Promise<void>;
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
        price: sql<number>`min(${voucherCards.price})::float8`,
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
    // Try upsert using unique constraint; fall back to delete+insert if constraint missing
    try {
      await db
        .insert(vendorPrices)
        .values({ vendorId, examType, price })
        .onConflictDoUpdate({
          target: [vendorPrices.vendorId, vendorPrices.examType],
          set: { price },
        });
    } catch {
      // Fallback: delete existing row and insert fresh
      await db.delete(vendorPrices).where(
        and(eq(vendorPrices.vendorId, vendorId), eq(vendorPrices.examType, examType))
      );
      await db.insert(vendorPrices).values({ vendorId, examType, price });
    }
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

  async updateVendorStoreName(vendorId: string, storeName: string): Promise<void> {
    await db.update(vendors).set({ storeName }).where(eq(vendors.id, vendorId));
  }

  async adminGetAllVendors(): Promise<{ vendor: Vendor; prices: VendorPrice[]; totalSales: number; totalRevenue: number; pendingProfit: number; lastPayoutAt: Date | null }[]> {
    const allVendors = await db.select().from(vendors).orderBy(desc(vendors.createdAt));
    const results = await Promise.all(allVendors.map(async (vendor) => {
      // Get last PAID payout — this is the cutoff for "new" profit
      const [lastPaidPayout] = await db.select({ paidAt: payouts.paidAt })
        .from(payouts)
        .where(and(eq(payouts.vendorId, vendor.id), eq(payouts.status, "paid")))
        .orderBy(desc(payouts.paidAt))
        .limit(1);

      // Get sales stats for all time
      const [totals] = await db.select({
        totalSales: sql<number>`count(*)::int`,
        totalRevenue: sql<number>`coalesce(sum(${transactions.amount}::numeric), 0)::numeric`,
      }).from(transactions)
        .where(and(eq(transactions.vendorId, vendor.id), eq(transactions.status, "completed")));

      // Pending profit: sum of vendor_profit since last PAID payout
      const pendingCondition = lastPaidPayout?.paidAt
        ? and(eq(transactions.vendorId, vendor.id), eq(transactions.status, "completed"), sql`${transactions.createdAt} > ${lastPaidPayout.paidAt}`)
        : and(eq(transactions.vendorId, vendor.id), eq(transactions.status, "completed"));
      const [pending] = await db.select({
        pendingProfit: sql<number>`coalesce(sum(${transactions.vendorProfit}::numeric), 0)::numeric`,
      }).from(transactions).where(pendingCondition);

      // Get vendor's custom prices
      const prices = await db.select().from(vendorPrices).where(eq(vendorPrices.vendorId, vendor.id)).orderBy(vendorPrices.examType);

      return {
        vendor,
        prices,
        totalSales: totals?.totalSales ?? 0,
        totalRevenue: Number(totals?.totalRevenue ?? 0),
        pendingProfit: Number(pending?.pendingProfit ?? 0),
        lastPayoutAt: lastPaidPayout?.paidAt ?? null,
      };
    }));
    return results;
  }

  async adminUpdateVendor(id: string, data: { storeName?: string; contactNumber?: string; momoNumber?: string; momoName?: string; status?: string }): Promise<Vendor> {
    const updateData: Record<string, any> = {};
    if (data.storeName !== undefined) updateData.storeName = data.storeName || null;
    if (data.contactNumber !== undefined) updateData.contactNumber = data.contactNumber;
    if (data.momoNumber !== undefined) updateData.momoNumber = data.momoNumber;
    if (data.momoName !== undefined) updateData.momoName = data.momoName;
    if (data.status !== undefined) updateData.status = data.status;
    const [updated] = await db.update(vendors).set(updateData).where(eq(vendors.id, id)).returning();
    return updated;
  }

  async adminCloseVendorForPayout(vendorId: string): Promise<Payout | null> {
    // Calculate pending profit since last paid payout
    const [lastPaidPayout] = await db.select({ paidAt: payouts.paidAt })
      .from(payouts)
      .where(and(eq(payouts.vendorId, vendorId), eq(payouts.status, "paid")))
      .orderBy(desc(payouts.paidAt))
      .limit(1);

    const pendingCondition = lastPaidPayout?.paidAt
      ? and(eq(transactions.vendorId, vendorId), eq(transactions.status, "completed"), sql`${transactions.createdAt} > ${lastPaidPayout.paidAt}`)
      : and(eq(transactions.vendorId, vendorId), eq(transactions.status, "completed"));

    const [pending] = await db.select({
      pendingProfit: sql<number>`coalesce(sum(${transactions.vendorProfit}::numeric), 0)::numeric`,
    }).from(transactions).where(pendingCondition);

    const amount = Number(pending?.pendingProfit ?? 0);

    // Close vendor
    await db.update(vendors).set({ status: "closed_for_payout" }).where(eq(vendors.id, vendorId));

    // Auto-create unpaid payout record (only if there's something owed)
    if (amount <= 0) return null;
    const [payout] = await db.insert(payouts).values({ vendorId, amount, status: "unpaid" }).returning();
    return payout;
  }

  async adminMarkPayoutPaid(payoutId: string): Promise<Payout> {
    const now = new Date();
    const [payout] = await db
      .update(payouts)
      .set({ status: "paid", paidAt: now })
      .where(eq(payouts.id, payoutId))
      .returning();
    // Reopen the vendor
    await db.update(vendors).set({ status: "active" }).where(eq(vendors.id, payout.vendorId));
    return payout;
  }

  async adminGetVendorPayouts(vendorId: string): Promise<Payout[]> {
    return await db.select().from(payouts).where(eq(payouts.vendorId, vendorId)).orderBy(desc(payouts.createdAt));
  }

  async adminCloseAllVendorsForPayout(): Promise<void> {
    const activeVendors = await db.select({ id: vendors.id }).from(vendors).where(eq(vendors.status, "active"));
    await Promise.all(activeVendors.map(v => this.adminCloseVendorForPayout(v.id)));
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
        price: sql<number>`min(${voucherCards.price})::float8`,
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

  async adminDeleteCardType(examType: string): Promise<{ deleted: number }> {
    // NULL out the FK on transactions first so we can delete used vouchers too
    await db.update(transactions)
      .set({ voucherCardId: null })
      .where(eq(transactions.examType, examType));
    // Delete ALL vouchers (used + unused) — transaction history is preserved via examType on transactions
    const deleted = await db
      .delete(voucherCards)
      .where(eq(voucherCards.examType, examType))
      .returning();
    // Remove vendor pricing entries and vendor base price for this card type
    await db.delete(vendorPrices).where(eq(vendorPrices.examType, examType));
    await db.delete(vendorBasePrices).where(eq(vendorBasePrices.examType, examType));
    return { deleted: deleted.length };
  }

  async adminUpdateCardTypePrice(examType: string, price: number): Promise<void> {
    await db.update(voucherCards).set({ price }).where(eq(voucherCards.examType, examType));
  }

  // ── Vendor Base Prices ────────────────────────────────────────────────────
  async getVendorBasePrices(): Promise<{ examType: string; price: number }[]> {
    return await db.select({ examType: vendorBasePrices.examType, price: vendorBasePrices.price }).from(vendorBasePrices);
  }

  async getVendorBasePrice(examType: string): Promise<number | null> {
    const [row] = await db.select().from(vendorBasePrices).where(eq(vendorBasePrices.examType, examType));
    return row?.price ?? null;
  }

  async setVendorBasePrice(examType: string, price: number): Promise<void> {
    await pool.query(
      `INSERT INTO vendor_base_prices (exam_type, price) VALUES ($1, $2)
       ON CONFLICT (exam_type) DO UPDATE SET price = EXCLUDED.price`,
      [examType, price]
    );
  }

  // ── Withdrawal Requests ───────────────────────────────────────────────────
  async createWithdrawalRequest(vendorId: string, amount: number, momoNumber: string, momoName: string): Promise<WithdrawalRequest> {
    const [req] = await db
      .insert(withdrawalRequests)
      .values({ vendorId, amount, momoNumber, momoName, status: "pending" })
      .returning();
    return req;
  }

  async getVendorWithdrawalRequests(vendorId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.vendorId, vendorId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async getVendorPendingWithdrawalRequest(vendorId: string): Promise<WithdrawalRequest | null> {
    const [req] = await db
      .select()
      .from(withdrawalRequests)
      .where(and(eq(withdrawalRequests.vendorId, vendorId), eq(withdrawalRequests.status, "pending")))
      .limit(1);
    return req ?? null;
  }

  async adminGetAllWithdrawalRequests(): Promise<(WithdrawalRequest & { vendor: Vendor })[]> {
    const rows = await db
      .select()
      .from(withdrawalRequests)
      .orderBy(desc(withdrawalRequests.createdAt));
    const results: (WithdrawalRequest & { vendor: Vendor })[] = [];
    for (const row of rows) {
      const [vendor] = await db.select().from(vendors).where(eq(vendors.id, row.vendorId));
      if (vendor) results.push({ ...row, vendor });
    }
    return results;
  }

  async adminApproveWithdrawalRequest(requestId: string): Promise<void> {
    const now = new Date();
    const [req] = await db
      .update(withdrawalRequests)
      .set({ status: "approved", resolvedAt: now })
      .where(eq(withdrawalRequests.id, requestId))
      .returning();
    if (!req) throw new Error("Withdrawal request not found");
    // Record as a paid payout so pending profit resets
    await db.insert(payouts).values({
      vendorId: req.vendorId,
      amount: req.amount,
      status: "paid",
      paidAt: now,
      notes: `Withdrawal request approved`,
    });
  }

  async adminRejectWithdrawalRequest(requestId: string, note?: string): Promise<void> {
    const now = new Date();
    await db
      .update(withdrawalRequests)
      .set({ status: "rejected", resolvedAt: now, note: note ?? null })
      .where(eq(withdrawalRequests.id, requestId));
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/[\s\+\-\(\)]/g, '');
    if (cleaned.startsWith('0')) cleaned = '233' + cleaned.substring(1);
    else if (!cleaned.startsWith('233')) cleaned = '233' + cleaned;
    return cleaned;
  }
}

export const storage = new DbStorage();
