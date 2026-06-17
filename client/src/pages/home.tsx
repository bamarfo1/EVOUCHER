import { useState } from "react";
import PurchaseForm from "@/components/PurchaseForm";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchaseSubmit = async (data: { email: string; phone: string; examType: string; quantity: number }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiRequest("POST", "/api/purchase/initialize", data);
      const response = await res.json();

      if (response.authorizationUrl) {
        sessionStorage.setItem("purchase_phone", data.phone);
        sessionStorage.setItem("purchase_email", data.email || "");
        window.location.href = response.authorizationUrl;
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
