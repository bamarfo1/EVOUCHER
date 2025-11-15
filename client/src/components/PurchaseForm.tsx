import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Phone, FileText, Lock, MessageCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import waecLogo from "@assets/Buy-WASSCE-Results-Checker-Cards-WAEC-Shortcode.png_1763208493592.png";
import alltekseLogo from "@assets/101-800x600_1763210592506.jpg";
import mtnLogo from "@assets/republic-bank-mtn-momo_1763209941271.jpg";
import telecelLogo from "@assets/images (1)_1763209941547.png";
import airtelTigoLogo from "@assets/airteltigo_1763209941612.jpg";
import visaLogo from "@assets/images (2)_1763209941664.png";

interface PurchaseFormProps {
  onSubmit: (data: { email: string; phone: string; examType: string }) => void;
  isLoading?: boolean;
}

export default function PurchaseForm({ onSubmit, isLoading = false }: PurchaseFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [examType, setExamType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, phone, examType });
  };

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
                data-testid="img-alltekse-logo"
              />
            </div>
            <img 
              src={waecLogo} 
              alt="WAEC Logo" 
              className="h-16 w-auto object-contain"
              data-testid="img-waec-logo"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" data-testid="text-site-title">
              AllTekSE e-Voucher
            </h1>
            <p className="text-sm text-muted-foreground">WAEC Result Checker Platform</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl mb-2" data-testid="text-card-title">Instant Delivery!</CardTitle>
              <CardDescription className="text-base leading-relaxed" data-testid="text-card-description">
                Once your payment is completed, your WAEC Result Checker Voucher will be sent to you automatically and immediately.
                <span className="block mt-2 font-medium text-foreground">No delays — fast, secure, and convenient.</span>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+233 XX XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Voucher will be sent via SMS to this number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="examType">Exam Type</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                  <Select value={examType} onValueChange={setExamType} required>
                    <SelectTrigger id="examType" className="pl-10 h-12" data-testid="select-exam-type">
                      <SelectValue placeholder="Select exam type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wassce" data-testid="option-wassce">WASSCE</SelectItem>
                      <SelectItem value="bece" data-testid="option-bece">BECE</SelectItem>
                      <SelectItem value="private-wassce" data-testid="option-private-wassce">PRIVATE WASSCE</SelectItem>
                      <SelectItem value="private-bece" data-testid="option-private-bece">PRIVATE BECE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg p-4 text-center border border-primary/20">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Price</p>
                  <p className="text-4xl font-bold text-primary" data-testid="text-price">GHC 20</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-center">Available Payment Options</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-card border rounded-lg p-3 hover-elevate transition-all" data-testid="payment-mtn">
                      <img 
                        src={mtnLogo} 
                        alt="MTN Mobile Money" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                    <div className="bg-card border rounded-lg p-3 hover-elevate transition-all" data-testid="payment-telecel">
                      <img 
                        src={telecelLogo} 
                        alt="Telecel Cash" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                    <div className="bg-card border rounded-lg p-3 hover-elevate transition-all" data-testid="payment-airteltigo">
                      <img 
                        src={airtelTigoLogo} 
                        alt="AirtelTigo Money" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                    <div className="bg-card border rounded-lg p-3 hover-elevate transition-all" data-testid="payment-visa">
                      <img 
                        src={visaLogo} 
                        alt="Visa Card" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 text-base font-semibold shadow-lg"
                  disabled={isLoading || !email || !phone || !examType}
                  data-testid="button-pay"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4 animate-pulse" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Pay GHC 20 Now
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Secured by Paystack</span>
                </div>
              </div>
            </form>
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
                <a href="mailto:support@alltekse.com" className="hover:text-foreground transition-colors" data-testid="link-email">
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
                  data-testid="link-whatsapp"
                >
                  WhatsApp: 0593260440
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
