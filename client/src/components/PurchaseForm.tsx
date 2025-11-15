import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Phone, FileText, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-4 px-4 border-b">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-center" data-testid="text-site-title">WAEC Voucher Purchase</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">Secure Payment via Paystack</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl" data-testid="text-card-title">Get Your WAEC Checker</CardTitle>
            <CardDescription data-testid="text-card-description">
              Fill in your details below to purchase a voucher instantly
            </CardDescription>
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
                      <SelectItem value="may-june" data-testid="option-may-june">May/June WASSCE</SelectItem>
                      <SelectItem value="nov-dec" data-testid="option-nov-dec">Nov/Dec WASSCE</SelectItem>
                      <SelectItem value="private" data-testid="option-private">Private Candidate</SelectItem>
                      <SelectItem value="gce" data-testid="option-gce">GCE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Price:</span>
                  <span className="text-3xl font-bold text-primary" data-testid="text-price">GHC 20</span>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-center text-muted-foreground">Accepted Payment Methods</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs font-medium" data-testid="badge-mtn">
                      MTN
                    </Badge>
                    <Badge variant="outline" className="text-xs font-medium" data-testid="badge-telecel">
                      TELECEL
                    </Badge>
                    <Badge variant="outline" className="text-xs font-medium" data-testid="badge-airteltigo">
                      AIRTEL TIGO
                    </Badge>
                    <Badge variant="outline" className="text-xs font-medium" data-testid="badge-visa">
                      VISA CARD
                    </Badge>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isLoading || !email || !phone || !examType}
                  data-testid="button-pay"
                >
                  {isLoading ? "Processing..." : "Pay GHC 20 - Get Voucher"}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Secured by Paystack</span>
                </div>

                <div className="bg-muted/50 rounded-md p-3 space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">Instant</Badge>
                    What happens next?
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                    <li>• Complete payment securely via Paystack</li>
                    <li>• Receive voucher instantly via SMS & Email</li>
                    <li>• Use the voucher to check your WAEC results</li>
                  </ul>
                </div>
              </div>
            </form>
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
