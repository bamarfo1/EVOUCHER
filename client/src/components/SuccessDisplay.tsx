import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, MessageSquare, ExternalLink, Copy, MessageCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

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

  const PORTAL_URLS: Record<string, string> = {
    "BECE": "https://eresults.waecgh.org/",
    "WASSCE": "https://ghana.waecdirect.org/",
  };

  const waecUrl = PORTAL_URLS[voucherData.examType] || null;
  const hasEmail = voucherData.email && voucherData.email.trim() !== '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src={alltekseLogo}
            alt="AllTekSE Logo"
            className="h-10 w-auto object-contain rounded-lg"
            data-testid="img-alltekse-logo"
          />
          <div>
            <h1 className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent" data-testid="text-site-title">
              AllTekSE e-Voucher
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">Your Trusted e-Voucher Store</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md space-y-4">

          {/* Success banner */}
          <div className="text-center space-y-3 py-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-white" data-testid="icon-success" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800" data-testid="text-success-title">Payment Successful!</h2>
              <p className="text-sm text-slate-500 mt-1" data-testid="text-success-description">
                {hasEmail
                  ? "Your voucher has been sent to your email and phone"
                  : "Your voucher has been sent via SMS"}
              </p>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold px-3 py-1" data-testid="badge-exam-type">
              {voucherData.examType} Voucher
            </Badge>
          </div>

          {/* Voucher details card */}
          <Card className="border-slate-200 shadow-lg overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500" />
            <CardContent className="p-5 space-y-4">

              {/* Serial */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Serial Number</p>
                <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <p className="text-lg font-black font-mono tracking-widest text-slate-800" data-testid="text-serial">
                    {voucherData.serial}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(voucherData.serial, 'serial')}
                    data-testid="button-copy-serial"
                    className="text-xs flex-shrink-0 text-slate-500 hover:text-purple-700"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    {copiedField === 'serial' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* PIN */}
              <div className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">PIN</p>
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-4 py-3">
                  <p className="text-2xl font-black font-mono tracking-widest text-purple-800" data-testid="text-pin">
                    {voucherData.pin}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(voucherData.pin, 'pin')}
                    data-testid="button-copy-pin"
                    className="text-xs flex-shrink-0 text-purple-500 hover:text-purple-700"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    {copiedField === 'pin' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Delivery info */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
                {hasEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-slate-500 font-medium">Email sent to</span>
                    <span className="text-slate-700 font-bold truncate" data-testid="text-email-sent">{voucherData.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 bg-emerald-100 rounded-md flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span className="text-slate-500 font-medium">SMS sent to</span>
                  <span className="text-slate-700 font-bold" data-testid="text-phone-sent">{voucherData.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portal link */}
          {waecUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">{voucherData.examType} Result Portal</p>
              <a
                href={waecUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline break-all"
                data-testid="link-portal-url"
              >
                {waecUrl}
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {waecUrl && (
              <Button
                className="w-full h-12 font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md shadow-purple-200"
                onClick={() => window.open(waecUrl, '_blank')}
                data-testid="button-check-results"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Check {voucherData.examType} Results Now
              </Button>
            )}
            {onStartNew && (
              <Button
                variant="outline"
                className="w-full h-12 font-semibold border-slate-200"
                onClick={onStartNew}
                data-testid="button-buy-another"
              >
                Buy Another Voucher
              </Button>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Keep your voucher details safe and secure.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <p className="text-slate-400 font-medium">Need Help?</p>
            <div className="flex items-center gap-4">
              <a href="mailto:support@alltekse.com" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors" data-testid="link-email">
                <Mail className="w-3.5 h-3.5" />
                support@alltekse.com
              </a>
              <a href="https://wa.me/233593260440" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors" data-testid="link-whatsapp">
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
