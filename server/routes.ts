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

      const paystackResponse = await initializePayment(
        validatedData.email,
        20,
        reference,
        {
          transactionId: transaction.id,
          examType: validatedData.examType,
          phone: validatedData.phone,
        }
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

      const verification = await verifyPayment(reference);
      
      if (verification.data.status === "success") {
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
      } else {
        await storage.updateTransactionStatus(transaction.id, "failed");
        res.json({
          status: "failed",
          message: "Payment verification failed",
        });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to verify payment" 
      });
    }
  });

  app.post("/api/webhook/paystack", async (req: Request, res: Response) => {
    try {
      const event = req.body;
      
      if (event.event === "charge.success") {
        const reference = event.data.reference;
        const transaction = await storage.getTransactionByReference(reference);
        
        if (transaction && transaction.status === "pending") {
          const availableVoucher = await storage.getAvailableVoucher();
          
          if (availableVoucher) {
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
