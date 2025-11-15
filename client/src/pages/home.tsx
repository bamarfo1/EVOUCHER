import { useState } from "react";
import { useLocation } from "wouter";
import PurchaseForm from "@/components/PurchaseForm";
import SuccessDisplay from "@/components/SuccessDisplay";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"form" | "success">("form");
  const [purchaseData, setPurchaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchaseSubmit = async (data: { email: string; phone: string; examType: string }) => {
    setIsLoading(true);
    
    try {
      const res = await apiRequest("POST", "/api/purchase/initialize", data);
      const response = await res.json();

      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = () => {
    setStep("form");
    setPurchaseData(null);
    setLocation("/");
  };

  if (step === "success" && purchaseData) {
    return <SuccessDisplay voucherData={purchaseData} onStartNew={handleStartNew} />;
  }

  return <PurchaseForm onSubmit={handlePurchaseSubmit} isLoading={isLoading} />;
}
