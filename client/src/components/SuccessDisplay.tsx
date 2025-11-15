import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, MessageSquare, ExternalLink, Copy, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import waecLogo from "@assets/Buy-WASSCE-Results-Checker-Cards-WAEC-Shortcode.png_1763208493592.png";

interface SuccessDisplayProps {
  voucherData: {
    serial: string;
    pin: string;
    email: string;
    phone: string;
    examType: string;
  };
  onStartNew?: () => void;
}

export default function SuccessDisplay({ voucherData, onStartNew }: SuccessDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const waecUrl = "https://bit.ly/waec-results";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-4 border-b bg-card">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center">
            <img 
              src={waecLogo} 
              alt="WAEC Logo" 
              className="h-16 w-auto object-contain"
              data-testid="img-waec-logo"
            />
          </div>
          <h1 className="text-xl font-bold text-center" data-testid="text-site-title">
            ALLTEKSE RESULT VOUCHER
          </h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" data-testid="icon-success" />
            </div>
            <div>
              <CardTitle className="text-2xl" data-testid="text-success-title">Payment Successful!</CardTitle>
              <CardDescription data-testid="text-success-description">
                Your voucher has been sent to your email and phone
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Serial Number</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(voucherData.serial, 'serial')}
                  data-testid="button-copy-serial"
                  className="h-8"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copiedField === 'serial' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-2xl font-bold font-mono tracking-wider" data-testid="text-serial">
                {voucherData.serial}
              </p>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">PIN</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(voucherData.pin, 'pin')}
                  data-testid="button-copy-pin"
                  className="h-8"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {copiedField === 'pin' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <p className="text-2xl font-bold font-mono tracking-wider" data-testid="text-pin">
                {voucherData.pin}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Exam Type</p>
              <Badge variant="secondary" data-testid="badge-exam-type">{voucherData.examType}</Badge>
            </div>

            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Email sent to</p>
                  <p className="text-muted-foreground" data-testid="text-email-sent">{voucherData.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">SMS sent to</p>
                  <p className="text-muted-foreground" data-testid="text-phone-sent">{voucherData.phone}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                className="w-full h-12"
                onClick={() => window.open(waecUrl, '_blank')}
                data-testid="button-check-results"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Check Your Results Now
              </Button>

              {onStartNew && (
                <Button
                  variant="outline"
                  className="w-full h-12"
                  onClick={onStartNew}
                  data-testid="button-buy-another"
                >
                  Buy Another Voucher
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Keep your voucher details safe. You'll need them to check your results.
              </p>
            </div>
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
                <a href="mailto:info@alltekse.com" className="hover:text-foreground transition-colors" data-testid="link-email">
                  info@alltekse.com
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
