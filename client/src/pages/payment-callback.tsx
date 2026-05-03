import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, XCircle, Mail, MessageCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SuccessDisplay from "@/components/SuccessDisplay";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

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

      if (data.status === "success" && data.vouchers) {
        const vendorSlug = sessionStorage.getItem("purchase_vendor_slug") || "";
        setVoucherData({
          vouchers: data.vouchers,
          email: sessionStorage.getItem("purchase_email") || "",
          phone: sessionStorage.getItem("purchase_phone") || "",
          transactionId: data.transactionId,
          amount: data.amount,
          createdAt: data.createdAt,
          vendorSlug,
        });
        sessionStorage.removeItem("purchase_phone");
        sessionStorage.removeItem("purchase_email");
        sessionStorage.removeItem("purchase_vendor_slug");
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
    const returnPath = voucherData.vendorSlug ? `/v/${voucherData.vendorSlug}` : "/";
    return <SuccessDisplay voucherData={voucherData} onStartNew={() => setLocation(returnPath)} />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={alltekseLogo} alt="AllTekSE Logo" className="h-10 w-auto object-contain rounded-lg" />
          <div>
            <h1 className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
              AllTekSE e-Voucher
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Your Trusted e-Voucher Store</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center space-y-6">

          {status === "verifying" && (
            <>
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl shadow-purple-200 animate-pulse">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Verifying Payment</h2>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Please wait while we confirm your payment and prepare your voucher PIN...
                </p>
              </div>
              <div className="flex flex-col items-center gap-2 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-1.5 rounded-full bg-purple-200 overflow-hidden" style={{ width: `${100 - (i - 1) * 20}%` }}>
                    <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  </div>
                ))}
              </div>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-red-200">
                <XCircle className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Payment Failed</h2>
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
                </div>
              </div>
              <div className="space-y-3">
                <Button
                  className="w-full h-12 font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md"
                  onClick={() => setLocation("/")}
                  data-testid="button-try-again"
                >
                  Try Again
                </Button>
                <p className="text-xs text-slate-400">Need help? Contact us below and we'll sort it out quickly.</p>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-slate-400 font-medium">Need Help?</p>
            <div className="flex items-center gap-4">
              <a href="mailto:support@alltekse.com" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" />
                support@alltekse.com
              </a>
              <a href="https://wa.me/233593260440" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-3 text-center">
            <p className="text-xs text-slate-500" data-testid="text-powered-by">© 2025 ALLTEK SOLUTIONS & ENGINEERING</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
