import { pgTable, text, varchar, timestamp, boolean, uuid, integer, doublePrecision, unique } from "drizzle-orm/pg-core";
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
  price: doublePrecision("price").notNull().default(20),
  imageUrl: text("image_url"),

  usedAt: timestamp("used_at"),
});

/* =========================
   Vendors
========================= */
export const vendors = pgTable("vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  phone: text("phone").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  storeName: text("store_name"),
  momoNumber: text("momo_number").notNull(),
  momoName: text("momo_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  slug: text("slug").unique().notNull(),
  status: text("status").notNull().default("active"),
  template: text("template").notNull().default("classic-purple"),
  customDomain: text("custom_domain"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   Vendor Prices
========================= */
export const vendorPrices = pgTable("vendor_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  examType: text("exam_type").notNull(),
  price: doublePrecision("price").notNull(),
}, (t) => ({
  vendorExamTypeUnique: unique().on(t.vendorId, t.examType),
}));

/* =========================
   Transactions
========================= */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),

  email: text("email"),
  phone: text("phone").notNull(),

  examType: text("exam_type").notNull(),

  amount: doublePrecision("amount").notNull(),
  quantity: integer("quantity").notNull().default(1),

  paystackReference: text("paystack_reference").unique(),

  status: text("status").notNull().default("pending"),

  voucherCardId: uuid("voucher_card_id").references(() => voucherCards.id),
  voucherCardIds: text("voucher_card_ids").array(),

  vendorId: uuid("vendor_id").references(() => vendors.id),
  vendorProfit: doublePrecision("vendor_profit"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

/* =========================
   Payouts
========================= */
export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  amount: doublePrecision("amount").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("unpaid"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   Blog Posts
========================= */
export const blogPosts = pgTable("blog_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content"),
  source: text("source").notNull(),
  sourceUrl: text("source_url").notNull().unique(),
  imageUrl: text("image_url"),
  category: text("category").default("Education"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   Card Type Registry (admin-managed list of available card types)
========================= */
export const cardTypeRegistry = pgTable("card_type_registry", {
  examType: text("exam_type").primaryKey(),
  price: doublePrecision("price").notNull().default(20),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/* =========================
   Vendor Base Prices (per card type, admin-configurable)
========================= */
export const vendorBasePrices = pgTable("vendor_base_prices", {
  examType: text("exam_type").primaryKey(),
  price: doublePrecision("price").notNull(),
});

/* =========================
   Withdrawal Requests (vendor-initiated)
========================= */
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  vendorId: uuid("vendor_id").notNull().references(() => vendors.id),
  amount: doublePrecision("amount").notNull(),
  momoNumber: text("momo_number").notNull(),
  momoName: text("momo_name").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

/* =========================
   Zod Insert Schemas
========================= */
export const insertVoucherCardSchema = createInsertSchema(voucherCards).omit({
  id: true,
  used: true,
  usedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions)
  .omit({
    id: true,
    createdAt: true,
    completedAt: true,
    status: true,
    paystackReference: true,
    voucherCardId: true,
    voucherCardIds: true,
    amount: true,
    vendorId: true,
  })
  .extend({
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(10),
    examType: z.string().min(1, "Please select a card type"),
    quantity: z.number().int().min(1).max(200).default(1),
    vendorSlug: z.string().optional(),
  });

export const insertVendorSchema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  momoNumber: z.string().min(10, "Enter a valid MoMo number"),
  momoName: z.string().min(2, "Enter your MoMo account name"),
  contactNumber: z.string().min(10, "Enter a valid contact number"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
});

/* =========================
   Types
========================= */
export type InsertVoucherCard = z.infer<typeof insertVoucherCardSchema>;
export type VoucherCard = typeof voucherCards.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type Vendor = typeof vendors.$inferSelect;
export type VendorPrice = typeof vendorPrices.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Payout = typeof payouts.$inferSelect;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
