import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { initializePayment, verifyPayment } from "./services/paystack";
import { sendVoucherEmail, sendVoucherSMS } from "./services/notifications";
import { randomBytes } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.post("/api/purchase/initialize", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      
      const availableVoucher = await storage.getAvailableVoucher(validatedData.examType);
      if (!availableVoucher) {
        return res.status(400).json({ 
          error: `No ${validatedData.examType} vouchers available at the moment. Please try again later or select a different exam type.` 
        });
      }

      const reference = `TXN-${Date.now()}-${randomBytes(4).toString('hex')}`;
      
      const emailToStore = validatedData.email && validatedData.email.trim() !== '' 
        ? validatedData.email 
        : null;
      
      const transaction = await storage.createTransaction({
        email: emailToStore,
        phone: validatedData.phone,
        examType: validatedData.examType,
        amount: "20",
        paystackReference: reference,
      });

      const baseUrl = process.env.BASE_URL || `http://localhost:5000`;
      
      const emailForPaystack = validatedData.email && validatedData.email.trim() !== '' 
        ? validatedData.email 
        : `${validatedData.phone.replace(/[^0-9]/g, '')}@noemail.alltekse.com`;
      
      const paystackResponse = await initializePayment(
        emailForPaystack,
        20,
        reference,
        {
          transactionId: transaction.id,
          examType: validatedData.examType,
          phone: validatedData.phone,
        },
        `${baseUrl}/payment-callback?reference=${reference}`
      );

      res.json({
        authorizationUrl: paystackResponse.data.authorization_url,
        reference: reference,
        transactionId: transaction.id,
      });
    } catch (error: any) {
      console.error("Purchase initialization error:", error);
      res.status(400).json({ 
        error: error.message || "Failed to initialize payment" 
      });
    }
  });

  app.get("/api/payment/verify/:reference", async (req: Request, res: Response) => {
    let transaction: any = null;
    let isProcessing = false;
    try {
      const { reference } = req.params;
      
      transaction = await storage.getTransactionByReference(reference);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.status === "completed") {
        const voucher = await storage.getVoucherById(transaction.voucherCardId!);
        return res.json({
          status: "success",
          voucher: {
            serial: voucher?.serial,
            pin: voucher?.pin,
            examType: transaction.examType,
          },
        });
      }

      if (transaction.status === "processing") {
        return res.status(409).json({ 
          error: "Payment verification already in progress. Please wait.",
          status: "processing"
        });
      }

      const processingUpdate = await storage.updateTransactionStatusConditional(
        transaction.id,
        "pending",
        "processing"
      );
      
      if (!processingUpdate) {
        return res.status(409).json({ 
          error: "Transaction already being processed by another request",
          status: "conflict"
        });
      }
      
      isProcessing = true;

      const verification = await verifyPayment(reference);
      
      if (verification.data.status !== "success") {
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.json({
          status: "failed",
          message: "Payment verification failed",
        });
      }

      const expectedAmount = 20 * 100;
      if (verification.data.amount !== expectedAmount) {
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.status(400).json({ 
          error: "Payment amount mismatch" 
        });
      }
      
      const result = await storage.assignVoucherToTransaction(
        transaction.id,
        transaction.phone,
        transaction.email,
        transaction.examType
      );
      
      if (!result) {
        return res.status(400).json({ 
          error: `No ${transaction.examType} vouchers available. Please contact support for a refund.` 
        });
      }

      const { transaction: updatedTransaction, voucher: updatedVoucher } = result;
      isProcessing = false;

      try {
        await Promise.all([
          sendVoucherEmail(
            updatedTransaction.email,
            updatedVoucher.serial,
            updatedVoucher.pin,
            updatedTransaction.examType
          ),
          sendVoucherSMS(
            updatedTransaction.phone,
            updatedVoucher.serial,
            updatedVoucher.pin,
            updatedTransaction.examType
          ),
        ]);
      } catch (notificationError) {
        console.error("Notification error (voucher already assigned):", notificationError);
      }

      res.json({
        status: "success",
        voucher: {
          serial: updatedVoucher.serial,
          pin: updatedVoucher.pin,
          examType: updatedTransaction.examType,
        },
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      
      if (transaction && isProcessing) {
        try {
          await storage.updateTransactionStatus(transaction.id, "failed");
        } catch (rollbackError) {
          console.error("Failed to rollback transaction status:", rollbackError);
        }
      }
      
      res.status(500).json({ 
        error: error.message || "Failed to verify payment" 
      });
    }
  });

  app.post("/api/webhook/paystack", async (req: Request, res: Response) => {
    let transaction: any = null;
    let isProcessing = false;
    
    try {
      const crypto = require('crypto');
      
      if (!req.rawBody) {
        console.error("Webhook: rawBody is undefined");
        return res.status(400).send("Invalid request: no raw body");
      }
      
      const secretKey = process.env.PAYSTACKSECRETKEYbright || process.env.PAYSTACK_SECRET_KEY || '';
      const hash = crypto.createHmac('sha512', secretKey)
        .update(req.rawBody as Buffer)
        .digest('hex');
      
      if (hash !== req.headers['x-paystack-signature']) {
        console.error("Invalid webhook signature", {
          computed: hash,
          received: req.headers['x-paystack-signature']
        });
        return res.status(401).send("Invalid signature");
      }

      const event = req.body;
      
      if (event.event === "charge.success") {
        const reference = event.data.reference;
        const amount = event.data.amount;
        const expectedAmount = 20 * 100;

        if (amount !== expectedAmount) {
          console.error("Webhook: Amount mismatch", { expected: expectedAmount, received: amount });
          return res.status(400).send("Amount mismatch");
        }

        transaction = await storage.getTransactionByReference(reference);
        
        if (!transaction) {
          console.error("Webhook: Transaction not found", reference);
          return res.status(404).send("Transaction not found");
        }

        if (transaction.status === "completed") {
          return res.status(200).send("Already processed");
        }

        if (transaction.status === "processing") {
          return res.status(409).send("Already processing");
        }

        const processingUpdate = await storage.updateTransactionStatusConditional(
          transaction.id,
          "pending",
          "processing"
        );
        
        if (!processingUpdate) {
          return res.status(409).send("Transaction already being processed by another request");
        }
        
        isProcessing = true;
        
        const result = await storage.assignVoucherToTransaction(
          transaction.id,
          transaction.phone,
          transaction.email,
          transaction.examType
        );
        
        if (!result) {
          console.error(`Webhook: No ${transaction.examType} vouchers available`);
          return res.status(400).send(`No ${transaction.examType} vouchers available`);
        }

        const { transaction: updatedTransaction, voucher: updatedVoucher } = result;
        isProcessing = false;

        try {
          await Promise.all([
            sendVoucherEmail(
              updatedTransaction.email,
              updatedVoucher.serial,
              updatedVoucher.pin,
              updatedTransaction.examType
            ),
            sendVoucherSMS(
              updatedTransaction.phone,
              updatedVoucher.serial,
              updatedVoucher.pin,
              updatedTransaction.examType
            ),
          ]);
        } catch (notificationError) {
          console.error("Webhook notification error (voucher already assigned):", notificationError);
        }
      }
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      
      if (transaction && isProcessing) {
        try {
          await storage.updateTransactionStatus(transaction.id, "failed");
        } catch (rollbackError) {
          console.error("Failed to rollback transaction status in webhook:", rollbackError);
        }
      }
      
      res.status(500).send("Webhook processing failed");
    }
  });

  app.get("/api/voucher/retrieve", async (req: Request, res: Response) => {
    try {
      const { phone, date } = req.query;
      
      if (!phone || !date) {
        return res.status(400).json({ 
          error: "Phone number and date are required" 
        });
      }

      const voucher = await storage.getVoucherByPhoneAndDate(
        phone as string, 
        date as string
      );

      if (!voucher) {
        return res.status(404).json({ 
          error: "No voucher found for this phone number and date" 
        });
      }

      res.json(voucher);
    } catch (error: any) {
      console.error("Voucher retrieval error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to retrieve voucher" 
      });
    }
  });

  app.post("/api/test/notifications", async (req: Request, res: Response) => {
    try {
      const { email, phone } = req.body;
      
      if (!email || !phone) {
        return res.status(400).json({ error: "Email and phone required" });
      }

      const testSerial = "TEST-2024-WAEC-9999";
      const testPin = "9999-9999-9999";
      const testExamType = "WASSCE";

      await Promise.all([
        sendVoucherEmail(email, testSerial, testPin, testExamType),
        sendVoucherSMS(phone, testSerial, testPin, testExamType),
      ]);

      res.json({ 
        success: true, 
        message: "Test notifications sent successfully" 
      });
    } catch (error: any) {
      console.error("Test notification error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to send test notifications" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
