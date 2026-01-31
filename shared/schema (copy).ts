import { pgTable, text, varchar, timestamp, boolean, uuid, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* =========================
   Voucher Cards
========================= */
export const voucherCards = pgTable("voucher_cards", {
  id: uuid("id").defaultRandom().primaryKey(),

  serial: text("serial").notNull().unique(),
  pin: text("pin").notNull(),

  used: boolean("used").notNull().default(false),

  purchaserPhone: text("purchaser_phone"),
  purchaserEmail: text("purchaser_email"),

  examType: text("exam_type"),

  usedAt: timestamp("used_at"),
});

/* =========================
   Transactions
========================= */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: text("email"),
  phone: text("phone").notNull(),

  examType: text("exam_type").notNull(),

  // Amount stored in KOBO
  amount: integer("amount").notNull(),

  paystackReference: text("paystack_reference").unique(),

  status: text("status").notNull().default("pending"),

  voucherCardId: uuid("voucher_card_id").references(() => voucherCards.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

/* =========================
   Zod Insert Schemas
========================= */
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
  paystackReference: true,
  voucherCardId: true,
}).extend({
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().min(10),
  examType: z.enum(["BECE", "WASSCE"], {
    errorMap: () => ({ message: "Please select either BECE or WASSCE" }),
  }),
});

/* =========================
   Types
========================= */
export type InsertVoucherCard = z.infer<typeof insertVoucherCardSchema>;
export type VoucherCard = typeof voucherCards.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;