import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuccessDisplay from "@/components/SuccessDisplay";

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [voucherData, setVoucherData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get("reference");

    if (!reference) {
      setStatus("failed");
      setErrorMessage("No payment reference found");
      return;
    }

    verifyPayment(reference);
  }, []);

  const verifyPayment = async (reference: string) => {
    try {
      const response = await fetch(`/api/payment/verify/${reference}`);
      const data = await response.json();

      if (data.status === "success" && data.voucher) {
        setVoucherData({
          serial: data.voucher.serial,
          pin: data.voucher.pin,
          examType: data.voucher.examType,
          email: "",
          phone: "",
        });
        setStatus("success");
      } else {
        setStatus("failed");
        setErrorMessage(data.message || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus("failed");
      setErrorMessage("Failed to verify payment. Please contact support.");
    }
  };

  if (status === "success" && voucherData) {
    return <SuccessDisplay voucherData={voucherData} onStartNew={() => setLocation("/")} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-4 border-b">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-center">WAEC Voucher Purchase</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              {status === "verifying" && <Loader2 className="w-10 h-10 text-primary animate-spin" />}
              {status === "success" && <CheckCircle2 className="w-10 h-10 text-primary" />}
              {status === "failed" && <XCircle className="w-10 h-10 text-destructive" />}
            </div>
            <CardTitle className="text-2xl">
              {status === "verifying" && "Verifying Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "failed" && "Payment Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            {status === "verifying" && (
              <p className="text-muted-foreground">
                Please wait while we verify your payment and prepare your voucher.
              </p>
            )}
            
            {status === "failed" && (
              <>
                <p className="text-muted-foreground">{errorMessage}</p>
                <Button
                  className="w-full"
                  onClick={() => setLocation("/")}
                  data-testid="button-try-again"
                >
                  Try Again
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      <footer className="py-4 px-4 border-t bg-card">
        <div className="max-w-md mx-auto text-center text-sm text-muted-foreground">
          <p>Need help? Contact support@waecvoucher.com</p>
        </div>
      </footer>
    </div>
  );
}
