import { useState } from "react";
import PurchaseForm from "@/components/PurchaseForm";
import SuccessDisplay from "@/components/SuccessDisplay";

export default function Home() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [purchaseData, setPurchaseData] = useState<any>(null);

  const handlePurchaseSubmit = (data: { email: string; phone: string; examType: string }) => {
    console.log('Purchase submitted:', data);
    
    // todo: remove mock functionality - In production, this would call Paystack payment API
    // Simulate payment processing
    setTimeout(() => {
      // todo: remove mock functionality - Mock voucher data
      const mockVoucher = {
        serial: `2024-WAEC-${Math.floor(1000 + Math.random() * 9000)}`,
        pin: `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        email: data.email,
        phone: data.phone,
        examType: data.examType === "may-june" ? "May/June WASSCE" : 
                 data.examType === "nov-dec" ? "Nov/Dec WASSCE" :
                 data.examType === "private" ? "Private Candidate" : "GCE"
      };
      
      setPurchaseData(mockVoucher);
      setStep("success");
    }, 1000);
  };

  const handleStartNew = () => {
    setStep("form");
    setPurchaseData(null);
  };

  if (step === "success" && purchaseData) {
    return <SuccessDisplay voucherData={purchaseData} onStartNew={handleStartNew} />;
  }

  return <PurchaseForm onSubmit={handlePurchaseSubmit} />;
}
