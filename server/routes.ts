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
      
      const availableVoucher = await storage.getAvailableVoucher();
      if (!availableVoucher) {
        return res.status(400).json({ 
          error: "No vouchers available at the moment. Please try again later." 
        });
      }

      const reference = `TXN-${Date.now()}-${randomBytes(4).toString('hex')}`;
      
      const transaction = await storage.createTransaction({
        ...validatedData,
        amount: "20",
        paystackReference: reference,
      });

      const examTypeNames: Record<string, string> = {
        "may-june": "May/June WASSCE",
        "nov-dec": "Nov/Dec WASSCE",
        "private": "Private Candidate",
        "gce": "GCE"
      };

      const baseUrl = process.env.BASE_URL || `http://localhost:5000`;
      
      const paystackResponse = await initializePayment(
        validatedData.email,
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
    try {
      const { reference } = req.params;
      
      const transaction = await storage.getTransactionByReference(reference);
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

      await storage.updateTransactionStatus(transaction.id, "processing");

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
      
      const availableVoucher = await storage.getAvailableVoucher();
      
      if (!availableVoucher) {
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.status(400).json({ 
          error: "No vouchers available" 
        });
      }

      const updatedVoucher = await storage.markVoucherAsUsed(
        availableVoucher.id,
        transaction.phone,
        transaction.email,
        transaction.examType
      );

      await storage.updateTransactionStatus(
        transaction.id, 
        "completed", 
        availableVoucher.id
      );

        const examTypeNames: Record<string, string> = {
          "may-june": "May/June WASSCE",
          "nov-dec": "Nov/Dec WASSCE",
          "private": "Private Candidate",
          "gce": "GCE"
        };

        try {
          await Promise.all([
            sendVoucherEmail(
              transaction.email,
              updatedVoucher.serial,
              updatedVoucher.pin,
              examTypeNames[transaction.examType] || transaction.examType
            ),
            sendVoucherSMS(
              transaction.phone,
              updatedVoucher.serial,
              updatedVoucher.pin
            ),
          ]);
        } catch (notificationError) {
          console.error("Notification error:", notificationError);
        }

        res.json({
          status: "success",
          voucher: {
            serial: updatedVoucher.serial,
            pin: updatedVoucher.pin,
            examType: examTypeNames[transaction.examType] || transaction.examType,
          },
        });
    } catch (error: any) {
      console.error("Payment verification error:", error);
      
      if (transaction && transaction.status === "processing") {
        await storage.updateTransactionStatus(transaction.id, "failed");
      }
      
      res.status(500).json({ 
        error: error.message || "Failed to verify payment" 
      });
    }
  });

  app.post("/api/webhook/paystack", async (req: Request, res: Response) => {
    try {
      const crypto = require('crypto');
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== req.headers['x-paystack-signature']) {
        console.error("Invalid webhook signature");
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

        const transaction = await storage.getTransactionByReference(reference);
        
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

        await storage.updateTransactionStatus(transaction.id, "processing");
        
        const availableVoucher = await storage.getAvailableVoucher();
        
        if (!availableVoucher) {
          await storage.updateTransactionStatus(transaction.id, "failed");
          console.error("Webhook: No vouchers available");
          return res.status(400).send("No vouchers available");
        }

        const updatedVoucher = await storage.markVoucherAsUsed(
          availableVoucher.id,
          transaction.phone,
          transaction.email,
          transaction.examType
        );

        await storage.updateTransactionStatus(
          transaction.id,
          "completed",
          availableVoucher.id
        );

        const examTypeNames: Record<string, string> = {
          "may-june": "May/June WASSCE",
          "nov-dec": "Nov/Dec WASSCE",
          "private": "Private Candidate",
          "gce": "GCE"
        };

        try {
          await Promise.all([
            sendVoucherEmail(
              transaction.email,
              updatedVoucher.serial,
              updatedVoucher.pin,
              examTypeNames[transaction.examType] || transaction.examType
            ),
            sendVoucherSMS(
              transaction.phone,
              updatedVoucher.serial,
              updatedVoucher.pin
            ),
          ]);
        } catch (notificationError) {
          console.error("Webhook notification error:", notificationError);
        }
      }
      
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).send("Webhook processing failed");
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
