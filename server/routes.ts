import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { initializePayment, verifyPayment } from "./services/paystack";
import { sendVoucherEmail, sendVoucherSMS, type VoucherItem } from "./services/notifications";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ─── Card Types ────────────────────────────────────────────────────────────
  app.get("/api/card-types", async (_req: Request, res: Response) => {
    try {
      const cardTypes = await storage.getAvailableCardTypes();
      res.json(cardTypes);
    } catch (error: any) {
      console.error("Error fetching card types:", error);
      res.status(500).json({ error: "Failed to fetch available card types" });
    }
  });

  // ─── Purchase ──────────────────────────────────────────────────────────────
  app.post("/api/purchase/initialize", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const quantity = validatedData.quantity ?? 1;
      const vendorSlug = (req.body as any).vendorSlug as string | undefined;

      const availableCount = await storage.getAvailableVoucherCount(validatedData.examType);
      if (availableCount === 0) {
        return res.status(400).json({ 
          error: `No ${validatedData.examType} vouchers available at the moment. Please try again later or select a different card type.` 
        });
      }
      if (quantity > availableCount) {
        return res.status(400).json({ 
          error: `Only ${availableCount} ${validatedData.examType} voucher${availableCount === 1 ? '' : 's'} available. Please reduce your quantity.` 
        });
      }

      // Get unit price — vendor overrides if applicable
      const sampleVoucher = await storage.getAvailableVoucher(validatedData.examType);
      let unitPrice = sampleVoucher!.price;
      let vendorId: string | null = null;

      if (vendorSlug) {
        const vendor = await storage.getVendorBySlug(vendorSlug);
        if (vendor && vendor.status === "active") {
          vendorId = vendor.id;
          const vp = await storage.getVendorPrice(vendor.id, validatedData.examType);
          if (vp) unitPrice = vp.price;
        }
      }

      const totalAmount = unitPrice * quantity;
      const reference = `TXN-${Date.now()}-${randomBytes(4).toString('hex')}`;
      
      const emailToStore = validatedData.email && validatedData.email.trim() !== '' 
        ? validatedData.email 
        : null;
      
      const transaction = await storage.createTransaction({
        email: emailToStore,
        phone: validatedData.phone,
        examType: validatedData.examType,
        amount: String(totalAmount),
        quantity,
        paystackReference: reference,
        vendorId,
      });

      const baseUrl = process.env.BASE_URL || `http://localhost:5000`;
      const emailForPaystack = validatedData.email && validatedData.email.trim() !== '' 
        ? validatedData.email 
        : `${validatedData.phone.replace(/[^0-9]/g, '')}@noemail.alltekse.com`;
      
      const paystackResponse = await initializePayment(
        emailForPaystack,
        totalAmount * 100,
        reference,
        { transactionId: transaction.id, examType: validatedData.examType, phone: validatedData.phone, quantity },
        `${baseUrl}/payment-callback?reference=${reference}`
      );

      res.json({
        authorizationUrl: paystackResponse.data.authorization_url,
        reference,
        transactionId: transaction.id,
      });
    } catch (error: any) {
      console.error("Purchase initialization error:", error);
      res.status(400).json({ error: error.message || "Failed to initialize payment" });
    }
  });

  // ─── Payment Verify ────────────────────────────────────────────────────────
  app.get("/api/payment/verify/:reference", async (req: Request, res: Response) => {
    let transaction: any = null;
    let isProcessing = false;
    try {
      const { reference } = req.params;
      
      transaction = await storage.getTransactionByReference(reference);
      if (!transaction) return res.status(404).json({ error: "Transaction not found" });

      if (transaction.status === "completed") {
        const allIds: string[] = (transaction as any).voucherCardIds ?? (transaction.voucherCardId ? [transaction.voucherCardId] : []);
        const voucherItems = await Promise.all(allIds.map((id: string) => storage.getVoucherById(id)));
        return res.json({
          status: "success",
          vouchers: voucherItems.filter(Boolean).map(v => ({
            serial: v!.serial,
            pin: v!.pin,
            examType: transaction.examType,
          })),
          transactionId: transaction.id,
          amount: transaction.amount,
          phone: transaction.phone,
          createdAt: transaction.createdAt,
        });
      }

      if (transaction.status === "processing") {
        return res.status(409).json({ error: "Payment verification already in progress. Please wait.", status: "processing" });
      }

      const processingUpdate = await storage.updateTransactionStatusConditional(transaction.id, "pending", "processing");
      if (!processingUpdate) {
        return res.status(409).json({ error: "Transaction already being processed by another request", status: "conflict" });
      }
      isProcessing = true;

      const verification = await verifyPayment(reference);
      if (verification.data.status !== "success") {
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.json({ status: "failed", message: "Payment verification failed" });
      }

      const expectedAmount = transaction.amount * 100;
      if (verification.data.amount !== expectedAmount) {
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.status(400).json({ error: "Payment amount mismatch" });
      }
      
      const qty = (transaction as any).quantity ?? 1;
      const result = await storage.assignVouchersToTransaction(transaction.id, transaction.phone, transaction.email, transaction.examType, qty);
      
      if (!result) {
        return res.status(400).json({ error: `No ${transaction.examType} vouchers available. Please contact support for a refund.` });
      }

      const { transaction: updatedTransaction, vouchers: updatedVouchers } = result;
      isProcessing = false;

      const voucherItems: VoucherItem[] = updatedVouchers.map(v => ({ serial: v.serial, pin: v.pin }));

      try {
        await Promise.all([
          sendVoucherEmail(updatedTransaction.email, voucherItems, updatedTransaction.examType),
          sendVoucherSMS(updatedTransaction.phone, voucherItems, updatedTransaction.examType),
        ]);
      } catch (notificationError) {
        console.error("Notification error (voucher already assigned):", notificationError);
      }

      res.json({
        status: "success",
        vouchers: updatedVouchers.map(v => ({ serial: v.serial, pin: v.pin, examType: updatedTransaction.examType })),
        transactionId: updatedTransaction.id,
        amount: updatedTransaction.amount,
        phone: updatedTransaction.phone,
        createdAt: updatedTransaction.createdAt,
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      if (transaction && isProcessing) {
        try { await storage.updateTransactionStatus(transaction.id, "failed"); } catch {}
      }
      res.status(500).json({ error: error.message || "Failed to verify payment" });
    }
  });

  // ─── Webhook ───────────────────────────────────────────────────────────────
  app.post("/api/webhook/paystack", async (req: Request, res: Response) => {
    let transaction: any = null;
    let isProcessing = false;
    try {
      const crypto = require('crypto');
      if (!req.rawBody) return res.status(400).send("Invalid request: no raw body");
      
      const secretKey = process.env.PAYSTACKSECRETKEYbright || process.env.PAYSTACK_SECRET_KEY || '';
      const hash = crypto.createHmac('sha512', secretKey).update(req.rawBody as Buffer).digest('hex');
      if (hash !== req.headers['x-paystack-signature']) return res.status(401).send("Invalid signature");

      const event = req.body;
      if (event.event === "charge.success") {
        const reference = event.data.reference;
        const amount = event.data.amount;
        transaction = await storage.getTransactionByReference(reference);
        if (!transaction) return res.status(404).send("Transaction not found");

        const expectedAmount = transaction.amount * 100;
        if (amount !== expectedAmount) return res.status(400).send("Amount mismatch");
        if (transaction.status === "completed") return res.status(200).send("Already processed");
        if (transaction.status === "processing") return res.status(409).send("Already processing");

        const processingUpdate = await storage.updateTransactionStatusConditional(transaction.id, "pending", "processing");
        if (!processingUpdate) return res.status(409).send("Transaction already being processed");
        isProcessing = true;
        
        const webhookQty = (transaction as any).quantity ?? 1;
        const result = await storage.assignVouchersToTransaction(transaction.id, transaction.phone, transaction.email, transaction.examType, webhookQty);
        if (!result) return res.status(400).send(`No ${transaction.examType} vouchers available`);

        const { transaction: updatedTransaction, vouchers: updatedVouchers } = result;
        isProcessing = false;
        const webhookVoucherItems: VoucherItem[] = updatedVouchers.map(v => ({ serial: v.serial, pin: v.pin }));
        try {
          await Promise.all([
            sendVoucherEmail(updatedTransaction.email, webhookVoucherItems, updatedTransaction.examType),
            sendVoucherSMS(updatedTransaction.phone, webhookVoucherItems, updatedTransaction.examType),
          ]);
        } catch (notificationError) {
          console.error("Webhook notification error:", notificationError);
        }
      }
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      if (transaction && isProcessing) {
        try { await storage.updateTransactionStatus(transaction.id, "failed"); } catch {}
      }
      res.status(500).send("Webhook processing failed");
    }
  });

  // ─── Voucher Retrieve ──────────────────────────────────────────────────────
  app.get("/api/voucher/retrieve", async (req: Request, res: Response) => {
    try {
      const { phone, date } = req.query;
      if (!phone || !date) return res.status(400).json({ error: "Phone number and date are required" });
      const vouchers = await storage.getVouchersByPhoneAndDate(phone as string, date as string);
      if (!vouchers || vouchers.length === 0) return res.status(404).json({ error: "No voucher found for this phone number and date" });
      res.json(vouchers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to retrieve voucher" });
    }
  });

  // ─── Vendor Auth ───────────────────────────────────────────────────────────

  function requireVendor(req: Request, res: Response, next: Function) {
    if ((req.session as any).vendorId) return next();
    res.status(401).json({ error: "Unauthorized" });
  }

  function generateSlug(phone: string): string {
    return phone.replace(/[\s\+\-\(\)]/g, '').replace(/^0/, '233').replace(/^(?!233)/, '233');
  }

  app.post("/api/vendor/register", async (req: Request, res: Response) => {
    try {
      const { phone, password, storeName, momoNumber, momoName, contactNumber } = req.body;
      if (!phone || !password || !momoNumber || !momoName || !contactNumber) {
        return res.status(400).json({ error: "All fields are required" });
      }
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

      const existing = await storage.getVendorByPhone(phone);
      if (existing) return res.status(400).json({ error: "A vendor account with this phone number already exists" });

      const passwordHash = await bcrypt.hash(password, 12);
      const slug = generateSlug(phone);

      const vendor = await storage.createVendor({ phone, passwordHash, storeName: storeName || null, momoNumber, momoName, contactNumber, slug });
      (req.session as any).vendorId = vendor.id;
      res.json({ success: true, slug: vendor.slug });
    } catch (error: any) {
      console.error("Vendor register error:", error);
      res.status(500).json({ error: error.message || "Registration failed" });
    }
  });

  app.post("/api/vendor/login", async (req: Request, res: Response) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) return res.status(400).json({ error: "Phone and password required" });

      const vendor = await storage.getVendorByPhone(phone);
      if (!vendor) return res.status(401).json({ error: "Invalid phone number or password" });

      const valid = await bcrypt.compare(password, vendor.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid phone number or password" });

      if (vendor.status !== "active") return res.status(403).json({ error: "Your account has been suspended" });

      (req.session as any).vendorId = vendor.id;
      res.json({ success: true, slug: vendor.slug });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Login failed" });
    }
  });

  app.post("/api/vendor/logout", requireVendor, (req: Request, res: Response) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  // ─── Vendor Dashboard APIs ────────────────────────────────────────────────

  app.get("/api/vendor/me", requireVendor, async (req: Request, res: Response) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const vendor = await storage.getVendorById(vendorId);
      if (!vendor) return res.status(404).json({ error: "Vendor not found" });
      const { passwordHash, ...safe } = vendor;
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/vendor/me/card-types", requireVendor, async (req: Request, res: Response) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const [baseTypes, myPrices] = await Promise.all([
        storage.getAvailableCardTypes(),
        storage.getVendorPrices(vendorId),
      ]);
      const priceMap = Object.fromEntries(myPrices.map(p => [p.examType, p.price]));
      res.json(baseTypes.map(ct => ({
        examType: ct.examType,
        count: ct.count,
        basePrice: ct.price,
        vendorPrice: priceMap[ct.examType] ?? null,
        imageUrl: ct.imageUrl,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/vendor/me/stats", requireVendor, async (req: Request, res: Response) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const stats = await storage.getVendorStats(vendorId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/vendor/prices", requireVendor, async (req: Request, res: Response) => {
    try {
      const vendorId = (req.session as any).vendorId;
      const { examType, price } = req.body;
      if (!examType || typeof price !== "number") return res.status(400).json({ error: "examType and price required" });

      // Validate price >= base price
      const baseTypes = await storage.getAvailableCardTypes();
      const base = baseTypes.find(b => b.examType === examType);
      if (base && price < base.price) {
        return res.status(400).json({ error: `Price cannot be lower than base price (GHC ${base.price})` });
      }

      await storage.upsertVendorPrice(vendorId, examType, price);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Vendor Public Page ───────────────────────────────────────────────────
  app.get("/api/vendor/:slug", async (req: Request, res: Response) => {
    try {
      const vendor = await storage.getVendorBySlug(req.params.slug);
      if (!vendor || vendor.status !== "active") return res.status(404).json({ error: "Vendor not found" });

      const [baseTypes, myPrices] = await Promise.all([
        storage.getAvailableCardTypes(),
        storage.getVendorPrices(vendor.id),
      ]);
      const priceMap = Object.fromEntries(myPrices.map(p => [p.examType, p.price]));

      res.json({
        name: vendor.storeName || vendor.momoName,
        storeName: vendor.storeName || vendor.momoName,
        contactNumber: vendor.contactNumber,
        slug: vendor.slug,
        prices: baseTypes.map(ct => ({
          examType: ct.examType,
          price: priceMap[ct.examType] ?? ct.price,
          basePrice: ct.price,
          count: ct.count,
          imageUrl: ct.imageUrl,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Blog ──────────────────────────────────────────────────────────────────
  app.get("/api/blog/posts", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 12, 50);
      const offset = parseInt(req.query.offset as string) || 0;
      const [posts, total] = await Promise.all([storage.getBlogPosts(limit, offset), storage.getBlogPostCount()]);
      res.json({ posts, total });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/blog/posts/:id", async (req: Request, res: Response) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ─── Sitemap ───────────────────────────────────────────────────────────────
  app.get("/sitemap.xml", async (_req: Request, res: Response) => {
    try {
      const baseUrl = process.env.BASE_URL || "https://allteksevoucher.store";
      const [posts] = await Promise.all([storage.getBlogPosts(200, 0)]);
      const staticUrls = [
        { loc: baseUrl, priority: "1.0", changefreq: "daily" },
        { loc: `${baseUrl}/blog`, priority: "0.9", changefreq: "daily" },
        { loc: `${baseUrl}/retrieve-voucher`, priority: "0.7", changefreq: "monthly" },
      ];
      const postUrls = posts.map((p) => ({
        loc: `${baseUrl}/blog/${p.id}`,
        priority: "0.7",
        changefreq: "weekly",
        lastmod: p.publishedAt ? new Date(p.publishedAt).toISOString().split("T")[0] : new Date(p.createdAt).toISOString().split("T")[0],
      }));
      const allUrls = [...staticUrls, ...postUrls];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${(u as any).lastmod ? `\n    <lastmod>${(u as any).lastmod}</lastmod>` : ""}
  </url>`).join("\n")}
</urlset>`;
      res.header("Content-Type", "application/xml");
      res.send(xml);
    } catch {
      res.status(500).send("Sitemap error");
    }
  });

  app.get("/robots.txt", (_req: Request, res: Response) => {
    const baseUrl = process.env.BASE_URL || "https://allteksevoucher.store";
    res.header("Content-Type", "text/plain");
    res.send(`User-agent: *\nAllow: /\nAllow: /blog\nAllow: /retrieve-voucher\nDisallow: /admin\nDisallow: /api/\nDisallow: /vendor/dashboard\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  // ─── Admin Auth ────────────────────────────────────────────────────────────
  const ADMIN_EMAIL = "bmarfo422@outlook.com";
  const ADMIN_PASSWORD = "Pass.422.244@";

  function requireAdmin(req: Request, res: Response, next: Function) {
    if ((req.session as any).adminLoggedIn) return next();
    res.status(401).json({ error: "Unauthorized" });
  }

  app.post("/api/admin/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      (req.session as any).adminLoggedIn = true;
      return res.json({ success: true });
    }
    res.status(401).json({ error: "Invalid credentials" });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {});
    res.json({ success: true });
  });

  app.get("/api/admin/check", (req: Request, res: Response) => {
    res.json({ loggedIn: !!(req.session as any).adminLoggedIn });
  });

  app.get("/api/admin/summary", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const [sales, cards] = await Promise.all([storage.adminGetSalesSummary(), storage.adminGetCardSummary()]);
      res.json({ sales, cards });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/transactions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const txns = await storage.adminGetRecentTransactions(limit);
      res.json(txns);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/vouchers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { vouchers } = req.body;
      if (!Array.isArray(vouchers) || vouchers.length === 0) return res.status(400).json({ error: "vouchers array required" });
      const count = await storage.adminAddVouchers(vouchers);
      res.json({ success: true, added: count });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/admin/card-image", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { examType, imageUrl } = req.body;
      if (!examType || !imageUrl) return res.status(400).json({ error: "examType and imageUrl required" });
      await storage.adminUpdateCardImage(examType, imageUrl);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/admin/vouchers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.adminDeleteVoucher(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
