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
  price: integer("price").notNull().default(20),
  imageUrl: text("image_url"),

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

  amount: integer("amount").notNull(),
  quantity: integer("quantity").notNull().default(1),

  paystackReference: text("paystack_reference").unique(),

  status: text("status").notNull().default("pending"),

  voucherCardId: uuid("voucher_card_id").references(() => voucherCards.id),
  voucherCardIds: text("voucher_card_ids").array(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
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
  })
  .extend({
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().min(10),
    examType: z.string().min(1, "Please select a card type"),
    quantity: z.number().int().min(1).max(200).default(1),
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

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
