import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, MessageSquare, ExternalLink, Copy, MessageCircle, ShieldCheck, CreditCard, Download, Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

export interface VoucherItem {
  serial: string;
  pin: string;
  examType: string;
}

interface SuccessDisplayProps {
  voucherData: {
    vouchers: VoucherItem[];
    email: string;
    phone: string;
    transactionId?: string;
    amount?: number;
    createdAt?: string;
  };
  onStartNew?: () => void;
}

const PORTAL_URLS: Record<string, string> = {
  "BECE": "https://eresults.waecgh.org/",
  "WASSCE": "https://ghana.waecdirect.org/",
};

function printReceipt(voucherData: SuccessDisplayProps["voucherData"]) {
  const { vouchers, email, phone, transactionId, amount, createdAt } = voucherData;
  const examType = vouchers[0]?.examType ?? "";
  const qty = vouchers.length;
  const date = createdAt ? new Date(createdAt).toLocaleString("en-GH", { dateStyle: "long", timeStyle: "short" }) : new Date().toLocaleString("en-GH", { dateStyle: "long", timeStyle: "short" });

  const voucherRows = vouchers.map((v, i) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:10px 8px;font-size:13px;color:#64748b;">${qty > 1 ? `Voucher ${i + 1}` : examType}</td>
      <td style="padding:10px 8px;font-size:13px;font-weight:700;font-family:monospace;color:#1e293b;">${v.serial}</td>
      <td style="padding:10px 8px;font-size:15px;font-weight:900;font-family:monospace;color:#6d28d9;">${v.pin}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>AllTekSE Receipt</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; padding:20px; }
    .receipt { max-width:520px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#7c3aed,#2563eb,#0d9488); padding:28px 28px 24px; color:#fff; text-align:center; }
    .header h1 { font-size:22px; font-weight:900; margin-bottom:4px; }
    .header p { font-size:12px; opacity:0.8; }
    .success-badge { display:inline-block; background:rgba(255,255,255,0.2); border:1px solid rgba(255,255,255,0.3); padding:4px 14px; border-radius:50px; font-size:12px; font-weight:700; margin-top:10px; }
    .body { padding:24px 28px; }
    .section-title { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; color:#94a3b8; margin-bottom:8px; margin-top:18px; }
    .info-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; }
    .info-row:last-child { border-bottom:none; }
    .info-label { color:#64748b; font-weight:500; }
    .info-value { color:#1e293b; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin-top:6px; }
    thead tr { background:#f8fafc; }
    thead th { padding:8px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; text-align:left; }
    .footer { background:#0f172a; padding:18px 28px; text-align:center; }
    .footer p { color:#64748b; font-size:11px; margin-bottom:3px; }
    .footer .brand { color:#c4b5fd; font-weight:700; font-size:12px; }
    @media print {
      body { background:white; padding:0; }
      .receipt { box-shadow:none; }
      .no-print { display:none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>AllTekSE e-Voucher</h1>
      <p>Your Trusted e-Voucher Store</p>
      <div class="success-badge">Payment Successful</div>
    </div>
    <div class="body">
      <p class="section-title">Transaction Details</p>
      <div>
        ${transactionId ? `<div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value" style="font-size:11px;font-family:monospace;">${transactionId.substring(0, 18)}...</span></div>` : ""}
        <div class="info-row"><span class="info-label">Date</span><span class="info-value">${date}</span></div>
        <div class="info-row"><span class="info-label">Card Type</span><span class="info-value">${examType}</span></div>
        <div class="info-row"><span class="info-label">Quantity</span><span class="info-value">${qty}</span></div>
        ${amount ? `<div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value" style="color:#059669;">GHC ${amount}</span></div>` : ""}
        <div class="info-row"><span class="info-label">Phone</span><span class="info-value">${phone}</span></div>
        ${email ? `<div class="info-row"><span class="info-label">Email</span><span class="info-value">${email}</span></div>` : ""}
      </div>

      <p class="section-title" style="margin-top:20px;">Voucher${qty > 1 ? "s" : ""}</p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Serial</th>
            <th>PIN</th>
          </tr>
        </thead>
        <tbody>${voucherRows}</tbody>
      </table>

      <div style="margin-top:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 14px;">
        <p style="font-size:11px;color:#1e40af;font-weight:700;">Keep this receipt safe.</p>
        <p style="font-size:11px;color:#3b82f6;margin-top:3px;">Your voucher details have also been sent via SMS${email ? " and email" : ""}.</p>
      </div>
    </div>
    <div class="footer">
      <p class="brand">AllTekSE e-Voucher</p>
      <p>support@alltekse.com | WhatsApp: +233 59 326 0440</p>
      <p style="margin-top:6px;">© 2025 ALLTEK SOLUTIONS & ENGINEERING</p>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=600,height=800");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export default function SuccessDisplay({ voucherData, onStartNew }: SuccessDisplayProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const vouchers = voucherData.vouchers ?? [];
  const examType = vouchers[0]?.examType ?? "";
  const waecUrl = PORTAL_URLS[examType] ?? null;
  const hasEmail = voucherData.email && voucherData.email.trim() !== '';
  const qty = vouchers.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={alltekseLogo} alt="AllTekSE Logo" className="h-10 w-auto object-contain rounded-lg" data-testid="img-alltekse-logo" />
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
                {qty > 1 ? `${qty} vouchers have been sent` : "Your voucher has been sent"}
                {hasEmail ? " to your email and phone" : " via SMS"}
              </p>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold px-3 py-1" data-testid="badge-exam-type">
              {qty > 1 ? `${qty} × ` : ""}{examType} Voucher{qty > 1 ? "s" : ""}
            </Badge>
          </div>

          {/* Voucher cards */}
          <div className="space-y-3">
            {vouchers.map((v, i) => (
              <Card key={i} className="border-slate-200 shadow-lg overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500" />
                <CardContent className="p-5 space-y-4">
                  {qty > 1 && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Voucher {i + 1} of {qty}</p>
                    </div>
                  )}

                  {/* Serial */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Serial Number</p>
                    <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                      <p className="text-base font-black font-mono tracking-widest text-slate-800" data-testid={`text-serial-${i}`}>
                        {v.serial}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(v.serial, `serial-${i}`)}
                        data-testid={`button-copy-serial-${i}`}
                        className="text-xs flex-shrink-0 text-slate-500 hover:text-purple-700"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {copiedField === `serial-${i}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>

                  {/* PIN */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">PIN</p>
                    <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-4 py-3">
                      <p className="text-xl font-black font-mono tracking-widest text-purple-800" data-testid={`text-pin-${i}`}>
                        {v.pin}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(v.pin, `pin-${i}`)}
                        data-testid={`button-copy-pin-${i}`}
                        className="text-xs flex-shrink-0 text-purple-500 hover:text-purple-700"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        {copiedField === `pin-${i}` ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

          {/* Portal link */}
          {waecUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">{examType} Result Portal</p>
              <a href={waecUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all" data-testid="link-portal-url">
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
                Check {examType} Results Now
              </Button>
            )}

            {/* Receipt Download */}
            <Button
              variant="outline"
              className="w-full h-12 font-semibold border-slate-200 gap-2"
              onClick={() => printReceipt(voucherData)}
              data-testid="button-download-receipt"
            >
              <Download className="w-4 h-4" />
              Download Receipt (PDF)
            </Button>

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
