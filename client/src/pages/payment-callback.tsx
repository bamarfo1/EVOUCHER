import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuccessDisplay from "@/components/SuccessDisplay";
import waecLogo from "@assets/Buy-WASSCE-Results-Checker-Cards-WAEC-Shortcode.png_1763208493592.png";
import alltekseLogo from "@assets/101-800x600_1763210592506.jpg";

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col">
      <header className="py-6 px-4 border-b bg-card shadow-sm">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="bg-black rounded-lg p-2">
              <img 
                src={alltekseLogo} 
                alt="AllTekSE Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <img 
              src={waecLogo} 
              alt="WAEC Logo" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              AllTekSE e-Voucher
            </h1>
            <p className="text-sm text-muted-foreground">WAEC Result Checker Platform</p>
          </div>
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

      <footer className="py-6 px-4 border-t bg-card">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">Need Help?</p>
            <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@alltekse.com" className="hover:text-foreground transition-colors">
                  support@alltekse.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <a 
                  href="https://wa.me/233593260440" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-foreground transition-colors"
                >
                  WhatsApp: 0593260440
                </a>
              </div>
            </div>
          </div>
          <div className="text-center pt-2 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground" data-testid="text-powered-by">
              Powered by ALLTEK SOLUTIONS & ENGINEERING
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
