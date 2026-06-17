import { useState, useEffect, useRef } from "react";
import PurchaseForm from "@/components/PurchaseForm";
import SuccessDisplay from "@/components/SuccessDisplay";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Loader2, MonitorSmartphone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = "form" | "terminal-wait" | "success";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export default function Home() {
  const [step, setStep] = useState<Step>("form");
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [terminalRef, setTerminalRef] = useState<string | null>(null);
  const [terminalExamType, setTerminalExamType] = useState<string | null>(null);
  const { toast } = useToast();
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStart = useRef<number>(0);

  const stopPolling = () => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const startPolling = (reference: string) => {
    pollStart.current = Date.now();
    pollTimer.current = setInterval(async () => {
      try {
        const elapsed = Date.now() - pollStart.current;
        if (elapsed > POLL_TIMEOUT_MS) {
          stopPolling();
          setStep("form");
          setErrorMessage("Payment timed out. Please try again at the counter.");
          return;
        }

        const res = await fetch(`/api/transaction/status/${reference}`);
        if (!res.ok) return;
        const { status } = await res.json();

        if (status === "completed") {
          stopPolling();
          // Fetch full voucher data
          const verifyRes = await fetch(`/api/payment/verify/${reference}`);
          const verifyData = await verifyRes.json();
          if (verifyData.status === "success") {
            setPurchaseData(verifyData);
            setStep("success");
          }
        } else if (status === "failed") {
          stopPolling();
          setStep("form");
          setErrorMessage("Payment failed at the terminal. Please try again.");
        }
      } catch {}
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => () => stopPolling(), []);

  const handlePurchaseSubmit = async (data: { email: string; phone: string; examType: string; quantity: number }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiRequest("POST", "/api/purchase/initialize", data);
      const response = await res.json();

      if (response.reference) {
        setTerminalRef(response.reference);
        setTerminalExamType(data.examType);
        setStep("terminal-wait");
        startPolling(response.reference);
        toast({ title: "Payment sent to terminal", description: "Please complete payment at the POS terminal." });
      } else {
        setErrorMessage("Failed to initialize payment. Please try again.");
      }
    } catch (error: any) {
      let cleanMessage = "Failed to process purchase. Please try again.";
      if (error.message) {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const errorData = JSON.parse(jsonMatch[0]);
            cleanMessage = errorData.error || cleanMessage;
          } else {
            cleanMessage = error.message;
          }
        } catch {
          cleanMessage = error.message;
        }
      }
      setErrorMessage(cleanMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = () => {
    stopPolling();
    setStep("form");
    setPurchaseData(null);
    setTerminalRef(null);
    setTerminalExamType(null);
  };

  if (step === "success" && purchaseData) {
    return <SuccessDisplay voucherData={purchaseData} onStartNew={handleStartNew} />;
  }

  if (step === "terminal-wait") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-purple-50 p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
              <MonitorSmartphone className="w-10 h-10 text-purple-600" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Complete Payment</h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Your <span className="font-semibold text-purple-700">{terminalExamType}</span> voucher order has been sent to the POS terminal.<br />
              Please pay at the counter to receive your voucher via SMS.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Order created successfully
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
              Waiting for terminal payment…
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
              Voucher delivered via SMS
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Ref: <span className="font-mono">{terminalRef}</span>
          </p>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartNew}
            className="text-slate-500 hover:text-slate-700"
            data-testid="button-cancel-terminal"
          >
            Cancel and go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert variant="destructive" className="shadow-lg bg-destructive border-destructive" data-testid="alert-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-destructive-foreground">Oops! Something went wrong</AlertTitle>
            <AlertDescription className="mt-2 space-y-3 text-destructive-foreground">
              {errorMessage.includes("No vouchers available") ? (
                <p className="font-medium">
                  We're currently out of stock. Please check back later or contact support for assistance.
                </p>
              ) : (
                <p className="font-medium">{errorMessage}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setErrorMessage(null)}
                className="w-full bg-white text-destructive hover:bg-white/90 border-white"
                data-testid="button-dismiss-error"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      <PurchaseForm onSubmit={handlePurchaseSubmit} isLoading={isLoading} />
    </>
  );
}
