import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const voucherCards = pgTable("voucher_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serial: text("serial").notNull().unique(),
  pin: text("pin").notNull(),
  used: boolean("used").notNull().default(false),
  purchaserPhone: text("purchaser_phone"),
  purchaserEmail: text("purchaser_email"),
  examType: text("exam_type"),
  usedAt: timestamp("used_at"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  examType: text("exam_type").notNull(),
  amount: text("amount").notNull(),
  paystackReference: text("paystack_reference").unique(),
  status: text("status").notNull().default("pending"),
  voucherCardId: varchar("voucher_card_id").references(() => voucherCards.id),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

export const insertVoucherCardSchema = createInsertSchema(voucherCards).omit({
  id: true,
  used: true,
  usedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  status: true,
  amount: true,
  paystackReference: true,
  voucherCardId: true,
}).extend({
  email: z.string().email(),
  phone: z.string().min(10),
  examType: z.string().min(1),
});

export type InsertVoucherCard = z.infer<typeof insertVoucherCardSchema>;
export type VoucherCard = typeof voucherCards.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
