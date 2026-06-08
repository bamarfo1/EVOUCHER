import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Phone, Mail, Lock, Loader2, Shield, CreditCard,
  Search, Minus, Plus, Zap, AlertCircle, MessageCircle, ArrowLeft,
} from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";
import mtnLogo from "@assets/republic-bank-mtn-momo_1763209941271.jpg";
import telecelLogo from "@assets/images (1)_1763209941547.png";
import airtelTigoLogo from "@assets/airteltigo_1763209941612.jpg";
import visaLogo from "@assets/images (2)_1763209941664.png";
import beceCardImage from "@assets/IMG-20260503-WA0021_1777811282955.jpg";
import wassceCardImage from "@assets/IMG-20260503-WA0022_1777811293981.jpg";
import { Link } from "wouter";
import { getTemplate } from "@/lib/vendor-templates";

const HARDCODED_CARD_IMAGES: Record<string, string> = {
  BECE: beceCardImage,
  WASSCE: wassceCardImage,
};
function getCardImage(examType: string, imageUrl: string | null): string | null {
  return HARDCODED_CARD_IMAGES[examType] ?? imageUrl ?? null;
}

interface VendorInfo {
  name: string;
  storeName: string;
  contactNumber: string;
  slug: string;
  status?: string;
  template?: string;
  prices: { examType: string; price: number; basePrice: number; count: number; imageUrl: string | null }[];
}

const CARD_COLORS: Record<string, { gradient: string; accentColor: string }> = {
  BECE:   { gradient: "linear-gradient(135deg,#10b981,#0d9488)", accentColor: "#10b981" },
  WASSCE: { gradient: "linear-gradient(135deg,#3b82f6,#4f46e5)", accentColor: "#3b82f6" },
};
const DEFAULT_COLORS = [
  { gradient: "linear-gradient(135deg,#a855f7,#7c3aed)", accentColor: "#a855f7" },
  { gradient: "linear-gradient(135deg,#f43f5e,#ec4899)", accentColor: "#f43f5e" },
  { gradient: "linear-gradient(135deg,#f59e0b,#ea580c)", accentColor: "#f59e0b" },
  { gradient: "linear-gradient(135deg,#06b6d4,#0284c7)", accentColor: "#06b6d4" },
];
function getColors(examType: string, index: number) {
  return CARD_COLORS[examType] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export default function VendorPage() {
  const { slug } = useParams<{ slug: string }>();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<VendorInfo["prices"][0] | null>(null);
  const [selectedColors, setSelectedColors] = useState<{ gradient: string; accentColor: string } | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: vendor, isLoading: vendorLoading, error } = useQuery<VendorInfo>({
    queryKey: [`/api/vendor/${slug}`],
    retry: false,
  });

  const template = getTemplate(vendor?.template ?? "classic-purple");
  const T = template.colors;
  const layout = template.layout;

  const openCard = (card: VendorInfo["prices"][0], colors: { gradient: string; accentColor: string }) => {
    setSelected(card);
    setSelectedColors(colors);
    setQuantity(1);
    setPhone("");
    setEmail("");
    setErrorMsg(null);
    setDialogOpen(true);
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      sessionStorage.setItem("purchase_phone", phone);
      sessionStorage.setItem("purchase_email", email || "");
      sessionStorage.setItem("purchase_vendor_slug", slug || "");
      const res = await fetch("/api/purchase/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email, examType: selected.examType, quantity, vendorSlug: slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to initialize payment");
      } else if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
        <AlertCircle className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">Store Not Found</h2>
        <p className="text-sm text-slate-500 text-center">This vendor page does not exist or has been removed.</p>
        <Link href="/" className="text-sm font-semibold text-purple-700 underline">Go to Main Store</Link>
      </div>
    );
  }

  const isClosed = vendor.status === "closed_for_payout";
  const waUrl = `https://wa.me/${vendor.contactNumber.replace(/[\s+\-()]/g, "").replace(/^0/, "233")}`;

  const payoutBanner = isClosed ? (
    <div style={{ background: "#fffbeb", borderBottom: "1px solid #fcd34d", padding: "10px 16px", textAlign: "center" }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: "#92400e" }} data-testid="banner-closed-for-payout">
        This store is temporarily closed for payout processing. Please check back shortly.
      </p>
    </div>
  ) : null;

  const purchaseDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-0" data-testid="dialog-vendor-purchase">
        <div className="p-6 text-white space-y-1" style={{ background: selectedColors?.gradient || "linear-gradient(135deg,#7c3aed,#3b82f6)" }}>
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-3 shadow-inner border border-white/30">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-black text-white">Purchase {selected?.examType}</DialogTitle>
          <DialogDescription className="text-white/80 text-sm">Fill in your details to receive your voucher instantly via SMS.</DialogDescription>
          <div className="pt-1">
            <span className="inline-block bg-white/20 border border-white/30 text-white text-sm font-bold px-3 py-1 rounded-full">
              GHC {selected ? selected.price * quantity : 0}
            </span>
          </div>
        </div>
        <form onSubmit={handlePurchase} className="p-5 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">{errorMsg}</div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="tel" placeholder="+233 XX XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11" required data-testid="input-vendor-purchase-phone" />
            </div>
            <p className="text-xs text-slate-400">Voucher PIN will be sent to this number via SMS</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">Email <span className="text-xs font-normal text-slate-400">(Optional)</span></Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="email" placeholder="your.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" data-testid="input-vendor-purchase-email" />
            </div>
          </div>
          {selected && Math.min(selected.count, 200) > 1 && (
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">Quantity <span className="text-xs font-normal text-slate-400">(max {Math.min(selected.count, 200)})</span></Label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50">
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-black text-slate-800">{quantity}</span>
                  <p className="text-xs text-slate-400 font-medium">Total: GHC {selected.price * quantity}</p>
                </div>
                <button type="button" onClick={() => setQuantity((q) => Math.min(Math.min(selected.count, 200), q + 1))} disabled={quantity >= Math.min(selected.count, 200)} className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          <div className="pt-2 space-y-3">
            <Button type="submit" className="w-full h-12 text-base font-bold text-white border-0" style={{ background: selectedColors?.gradient || "linear-gradient(135deg,#7c3aed,#3b82f6)" }} disabled={isLoading || !phone} data-testid="button-vendor-pay">
              {isLoading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
                : <span className="flex items-center gap-2"><Lock className="w-4 h-4" />Pay GHC {selected ? selected.price * quantity : 0} — Secure Checkout</span>}
            </Button>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Secured & processed by <span className="font-semibold text-slate-700">Paystack</span></span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[{ src: mtnLogo, alt: "MTN MoMo" }, { src: telecelLogo, alt: "Telecel" }, { src: airtelTigoLogo, alt: "AirtelTigo" }, { src: visaLogo, alt: "Visa" }].map(({ src, alt }) => (
                <div key={alt} className="bg-white border border-slate-100 rounded-lg p-1.5 shadow-sm">
                  <img src={src} alt={alt} className="w-full h-7 object-contain" />
                </div>
              ))}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  // ─── Layout: Classic ────────────────────────────────────────────────────────
  if (layout === "classic") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.pageBg }}>
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: T.headerBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.cardBorder}`, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, background: T.heroGradient, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CreditCard style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: T.headerText, lineHeight: 1.2 }}>{vendor.name}</p>
                <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Powered by AllTekSE e-Voucher</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: 999, textDecoration: "none" }} data-testid="link-vendor-whatsapp">
                <MessageCircle style={{ width: 13, height: 13 }} />WhatsApp
              </a>
              <a href={`tel:${vendor.contactNumber}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 999, textDecoration: "none" }} data-testid="link-vendor-contact">
                <Phone style={{ width: 13, height: 13 }} />Call
              </a>
              <Link href={`/retrieve-voucher?vendor=${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.headerText, background: T.cardBorder + "44", border: `1px solid ${T.cardBorder}`, padding: "6px 12px", borderRadius: 999, textDecoration: "none" }} data-testid="link-retrieve-voucher">
                <Search style={{ width: 13, height: 13 }} />Lost Voucher?
              </Link>
            </div>
          </div>
        </header>
        {payoutBanner}
        <section style={{ background: T.heroGradient, padding: "48px 16px", textAlign: "center", color: T.heroText }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.badgeBg, border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 999, marginBottom: 14 }}>
              <Zap style={{ width: 12, height: 12 }} />Authorised AllTekSE Vendor
            </span>
            <h1 style={{ fontSize: "clamp(1.8rem,6vw,3rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 10, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>{vendor.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500, marginBottom: 16 }}>Purchase exam vouchers — instant SMS delivery to your phone.</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
              {[{ icon: Zap, label: "Instant Delivery" }, { icon: Shield, label: "100% Secure" }].map(({ icon: Icon, label }) => (
                <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 999 }}>
                  <Icon style={{ width: 12, height: 12 }} />{label}
                </span>
              ))}
            </div>
          </div>
        </section>
        <main style={{ flex: 1, padding: "32px 16px" }}>
          <div style={{ maxWidth: 680, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b" }}>Available Vouchers</h2>
              <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Tap a card to purchase instantly</p>
            </div>
            {vendor.prices.length === 0 ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 40, textAlign: "center" }}>
                <CreditCard style={{ width: 40, height: 40, color: "#cbd5e1", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "#94a3b8" }}>No vouchers available right now.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
                {vendor.prices.map((card, index) => {
                  const colors = getColors(card.examType, index);
                  const img = getCardImage(card.examType, card.imageUrl);
                  const disabled = card.count === 0 || isClosed;
                  return (
                    <button key={card.examType} onClick={() => !disabled && openCard(card, colors)} disabled={disabled}
                      style={{ background: disabled ? "#f8fafc" : T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, overflow: "hidden", textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "transform 0.18s,box-shadow 0.18s", boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.07)" }}
                      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.13)"; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = disabled ? "none" : "0 2px 8px rgba(0,0,0,0.07)"; }}
                      data-testid={`vendor-card-${card.examType.toLowerCase()}`}>
                      <div style={{ height: 3, background: disabled ? "#f1f5f9" : colors.gradient }} />
                      {img ? (
                        <div style={{ width: "100%", height: 120, overflow: "hidden", background: "#f1f5f9" }}>
                          <img src={img} alt={card.examType} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: disabled ? "#f1f5f9" : colors.gradient }}>
                          <CreditCard style={{ width: 40, height: 40, color: disabled ? "#cbd5e1" : "rgba(255,255,255,0.8)" }} />
                        </div>
                      )}
                      <div style={{ padding: "12px 14px" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 6 }}>{card.examType}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 20, fontWeight: 900, color: disabled ? "#94a3b8" : colors.accentColor }}>GHC {card.price}</span>
                          {card.count === 0 ? <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Sold Out</span>
                            : <span style={{ fontSize: 11, background: `${colors.accentColor}18`, color: colors.accentColor, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{card.count} left</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <footer style={{ background: T.footerBg, color: T.footerText, padding: "24px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <img src={alltekseLogo} alt="AllTekSE" style={{ height: 26, objectFit: "contain", borderRadius: 4, opacity: 0.75 }} />
            <span style={{ fontSize: 12, opacity: 0.7 }}>Powered by AllTekSE e-Voucher</span>
          </div>
          <p style={{ fontSize: 11, opacity: 0.5 }}>© 2025 ALLTEK SOLUTIONS &amp; ENGINEERING</p>
        </footer>
        {purchaseDialog}
      </div>
    );
  }

  // ─── Layout: Modern ─────────────────────────────────────────────────────────
  if (layout === "modern") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#ffffff" }}>
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `3px solid ${T.primary}`, padding: "14px 16px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 18, fontWeight: 900, color: T.primary, lineHeight: 1.1 }}>{vendor.name}</p>
              <p style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>AllTekSE Authorised Vendor</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#16a34a", border: "1px solid #bbf7d0", padding: "6px 12px", borderRadius: 8, textDecoration: "none" }} data-testid="link-vendor-whatsapp">
                <MessageCircle style={{ width: 13, height: 13 }} />WhatsApp
              </a>
              <a href={`tel:${vendor.contactNumber}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#475569", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 8, textDecoration: "none" }} data-testid="link-vendor-contact">
                <Phone style={{ width: 13, height: 13 }} />Call
              </a>
              <Link href={`/retrieve-voucher?vendor=${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.primary, border: `1px solid ${T.cardBorder}`, padding: "6px 12px", borderRadius: 8, textDecoration: "none" }} data-testid="link-retrieve-voucher">
                <Search style={{ width: 13, height: 13 }} />Lost Voucher?
              </Link>
            </div>
          </div>
        </header>
        {payoutBanner}
        <section style={{ background: T.pageBg, borderBottom: `1px solid ${T.cardBorder}`, padding: "40px 16px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, textTransform: "uppercase", letterSpacing: "0.08em" }}>Authorised Vendor</span>
              <h2 style={{ fontSize: "clamp(1.6rem,5vw,2.8rem)", fontWeight: 900, color: "#0f172a", lineHeight: 1.15, margin: "6px 0 10px" }}>{vendor.name}</h2>
              <p style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>Purchase WAEC &amp; exam vouchers with instant SMS delivery.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ icon: Zap, label: "Instant SMS Delivery" }, { icon: Shield, label: "100% Secure Payment" }].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: "8px 14px" }}>
                  <Icon style={{ width: 14, height: 14, color: T.primary }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        <main style={{ flex: 1, padding: "32px 16px" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>Available Vouchers</p>
            {vendor.prices.length === 0 ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 10, padding: 40, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>No vouchers available right now.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
                {vendor.prices.map((card, index) => {
                  const colors = getColors(card.examType, index);
                  const img = getCardImage(card.examType, card.imageUrl);
                  const disabled = card.count === 0 || isClosed;
                  return (
                    <button key={card.examType} onClick={() => !disabled && openCard(card, colors)} disabled={disabled}
                      style={{ background: "#fff", border: `1px solid ${T.cardBorder}`, borderLeft: `4px solid ${disabled ? "#e2e8f0" : T.primary}`, borderRadius: "0 8px 8px 0", overflow: "hidden", textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "background 0.15s,box-shadow 0.15s", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}
                      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = T.pageBg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "#fff"; }}
                      data-testid={`vendor-card-${card.examType.toLowerCase()}`}>
                      {img ? (
                        <div style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 6, overflow: "hidden", background: "#f1f5f9" }}>
                          <img src={img} alt={card.examType} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 6, background: disabled ? "#f1f5f9" : colors.gradient, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CreditCard style={{ width: 24, height: 24, color: disabled ? "#cbd5e1" : "rgba(255,255,255,0.9)" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{card.examType}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: disabled ? "#94a3b8" : T.primary }}>GHC {card.price}</span>
                          {card.count === 0 ? <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "2px 7px", borderRadius: 999, fontWeight: 700 }}>Sold Out</span>
                            : <span style={{ fontSize: 11, color: T.primary, fontWeight: 600 }}>{card.count} left</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <footer style={{ background: "#f8fafc", borderTop: `1px solid ${T.cardBorder}`, padding: "20px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <img src={alltekseLogo} alt="AllTekSE" style={{ height: 22, objectFit: "contain", borderRadius: 3, opacity: 0.6 }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Powered by AllTekSE e-Voucher · © 2025</span>
          </div>
        </footer>
        {purchaseDialog}
      </div>
    );
  }

  // ─── Layout: Bold ────────────────────────────────────────────────────────────
  if (layout === "bold") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.pageBg }}>
        <section style={{ background: T.heroGradient, padding: "24px 16px 52px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.08), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 900, margin: "0 auto", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", padding: "5px 14px", borderRadius: 999 }}>
                <img src={alltekseLogo} alt="AllTekSE" style={{ height: 18, objectFit: "contain", borderRadius: 2 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>AllTekSE Vendor</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: 999, textDecoration: "none" }} data-testid="link-vendor-whatsapp">
                  <MessageCircle style={{ width: 13, height: 13 }} />WhatsApp
                </a>
                <a href={`tel:${vendor.contactNumber}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: 999, textDecoration: "none" }} data-testid="link-vendor-contact">
                  <Phone style={{ width: 13, height: 13 }} />Call
                </a>
                <Link href={`/retrieve-voucher?vendor=${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", padding: "6px 14px", borderRadius: 999, textDecoration: "none" }} data-testid="link-retrieve-voucher">
                  <Search style={{ width: 13, height: 13 }} />Lost Voucher?
                </Link>
              </div>
            </div>
            <h1 style={{ fontSize: "clamp(2.4rem,9vw,5.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.0, letterSpacing: "-0.02em", marginBottom: 12, textShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>{vendor.name}</h1>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: 500 }}>Purchase exam vouchers · instant delivery via SMS</p>
          </div>
        </section>
        {payoutBanner}
        <main style={{ flex: 1, padding: "32px 16px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: T.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Choose a Voucher</p>
            {vendor.prices.length === 0 ? (
              <div style={{ border: "1px dashed #cbd5e1", borderRadius: 12, padding: 40, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>No vouchers available right now.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {vendor.prices.map((card, index) => {
                  const colors = getColors(card.examType, index);
                  const img = getCardImage(card.examType, card.imageUrl);
                  const disabled = card.count === 0 || isClosed;
                  return (
                    <button key={card.examType} onClick={() => !disabled && openCard(card, colors)} disabled={disabled}
                      style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderLeft: `5px solid ${disabled ? "#e2e8f0" : T.primary}`, borderRadius: "0 12px 12px 0", overflow: "hidden", textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "transform 0.15s,box-shadow 0.15s", display: "flex", alignItems: "center", gap: 16, padding: 0 }}
                      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "scale(1.01)"; e.currentTarget.style.boxShadow = `0 6px 20px ${T.primary}28`; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                      data-testid={`vendor-card-${card.examType.toLowerCase()}`}>
                      {img ? (
                        <div style={{ width: 110, height: 90, flexShrink: 0, overflow: "hidden", background: "#f1f5f9" }}>
                          <img src={img} alt={card.examType} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: 110, height: 90, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: disabled ? "#f1f5f9" : colors.gradient }}>
                          <CreditCard style={{ width: 36, height: 36, color: disabled ? "#cbd5e1" : "rgba(255,255,255,0.85)" }} />
                        </div>
                      )}
                      <div style={{ flex: 1, padding: "14px 0" }}>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#1e293b", marginBottom: 3 }}>{card.examType}</p>
                        <p style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>Exam Result Checker Voucher</p>
                      </div>
                      <div style={{ padding: "0 20px", textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 22, fontWeight: 900, color: disabled ? "#94a3b8" : T.primary }}>GHC {card.price}</p>
                        {card.count === 0 ? <span style={{ fontSize: 10, background: "#fee2e2", color: "#dc2626", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Sold Out</span>
                          : <span style={{ fontSize: 11, color: T.primary, fontWeight: 600 }}>{card.count} in stock</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <footer style={{ background: T.footerBg, color: T.footerText, padding: "22px 16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <img src={alltekseLogo} alt="AllTekSE" style={{ height: 22, objectFit: "contain", borderRadius: 3, opacity: 0.85, filter: "brightness(10)" }} />
            <span style={{ fontSize: 12, opacity: 0.85 }}>AllTekSE e-Voucher · © 2025</span>
          </div>
        </footer>
        {purchaseDialog}
      </div>
    );
  }

  // ─── Layout: Minimal ─────────────────────────────────────────────────────────
  if (layout === "minimal") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#fff" }}>
        <div style={{ borderBottom: "1px solid #f1f5f9", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/" style={{ color: "#94a3b8", display: "flex", alignItems: "center" }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </Link>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>{vendor.name}</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#16a34a", textDecoration: "none" }} data-testid="link-vendor-whatsapp">
              <MessageCircle style={{ width: 13, height: 13 }} />WhatsApp
            </a>
            <span style={{ color: "#e2e8f0" }}>·</span>
            <a href={`tel:${vendor.contactNumber}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: "#475569", textDecoration: "none" }} data-testid="link-vendor-contact">
              <Phone style={{ width: 13, height: 13 }} />Call
            </a>
            <span style={{ color: "#e2e8f0" }}>·</span>
            <Link href={`/retrieve-voucher?vendor=${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: T.primary, textDecoration: "none" }} data-testid="link-retrieve-voucher">
              <Search style={{ width: 13, height: 13 }} />Lost?
            </Link>
          </div>
        </div>
        <div style={{ height: 4, background: T.heroGradient }} />
        {payoutBanner}
        <main style={{ flex: 1, padding: "24px 16px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Vouchers</h2>
              <p style={{ fontSize: 13, color: "#94a3b8" }}>from {vendor.name}</p>
            </div>
            {vendor.prices.length === 0 ? (
              <div style={{ border: "1px dashed #e2e8f0", borderRadius: 10, padding: 40, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "#94a3b8" }}>No vouchers available right now.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 10 }}>
                {vendor.prices.map((card, index) => {
                  const colors = getColors(card.examType, index);
                  const img = getCardImage(card.examType, card.imageUrl);
                  const disabled = card.count === 0 || isClosed;
                  return (
                    <button key={card.examType} onClick={() => !disabled && openCard(card, colors)} disabled={disabled}
                      style={{ background: "#fff", border: `1px solid ${disabled ? "#f1f5f9" : T.cardBorder}`, borderRadius: 8, overflow: "hidden", textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "box-shadow 0.15s" }}
                      onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.09)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; }}
                      data-testid={`vendor-card-${card.examType.toLowerCase()}`}>
                      {img ? (
                        <div style={{ width: "100%", height: 90, overflow: "hidden", background: "#f8fafc" }}>
                          <img src={img} alt={card.examType} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      ) : (
                        <div style={{ width: "100%", height: 90, display: "flex", alignItems: "center", justifyContent: "center", background: disabled ? "#f8fafc" : colors.gradient }}>
                          <CreditCard style={{ width: 32, height: 32, color: disabled ? "#cbd5e1" : "rgba(255,255,255,0.85)" }} />
                        </div>
                      )}
                      <div style={{ padding: "10px 12px" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", marginBottom: 3 }}>{card.examType}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: disabled ? "#94a3b8" : T.primary }}>GHC {card.price}</span>
                          {card.count === 0 && <span style={{ fontSize: 9, background: "#fee2e2", color: "#dc2626", padding: "1px 6px", borderRadius: 999, fontWeight: 700 }}>Out</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <footer style={{ borderTop: "1px solid #f8fafc", padding: "12px 16px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#cbd5e1" }}>Powered by AllTekSE e-Voucher · © 2025</p>
        </footer>
        {purchaseDialog}
      </div>
    );
  }

  // ─── Layout: Dark ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.pageBg }}>
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: T.headerBg, borderBottom: `1px solid ${T.cardBorder}`, padding: "12px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: T.primary + "22", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.primary}44` }}>
              <CreditCard style={{ width: 16, height: 16, color: T.primary }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: T.primary, lineHeight: 1.2 }}>{vendor.name}</p>
              <p style={{ fontSize: 10, color: T.cardBorder, fontWeight: 500 }}>AllTekSE Vendor</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#4ade80", background: "#16a34a22", border: "1px solid #4ade8044", padding: "6px 12px", borderRadius: 999, textDecoration: "none" }} data-testid="link-vendor-whatsapp">
              <MessageCircle style={{ width: 13, height: 13 }} />WhatsApp
            </a>
            <a href={`tel:${vendor.contactNumber}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.primary, background: T.primary + "18", border: `1px solid ${T.primary}44`, padding: "6px 12px", borderRadius: 999, textDecoration: "none" }} data-testid="link-vendor-contact">
              <Phone style={{ width: 13, height: 13 }} />Call
            </a>
            <Link href={`/retrieve-voucher?vendor=${slug}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: T.primary, background: T.primary + "18", border: `1px solid ${T.primary}44`, padding: "6px 12px", borderRadius: 999, textDecoration: "none" }} data-testid="link-retrieve-voucher">
              <Search style={{ width: 13, height: 13 }} />Lost Voucher?
            </Link>
          </div>
        </div>
      </header>
      {payoutBanner}
      <section style={{ background: T.heroGradient, padding: "52px 16px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${T.primary}30, transparent 65%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.primary + "22", border: `1px solid ${T.primary}44`, color: T.primary, fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 999, marginBottom: 16 }}>
            <Zap style={{ width: 12, height: 12 }} />Authorised AllTekSE Vendor
          </span>
          <h1 style={{ fontSize: "clamp(1.8rem,6vw,3.2rem)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 10, textShadow: `0 0 40px ${T.primary}60` }}>{vendor.name}</h1>
          <p style={{ color: T.cardBorder, fontSize: 13, fontWeight: 500, marginBottom: 18 }}>Purchase exam vouchers — instant SMS delivery</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {[{ icon: Zap, label: "Instant Delivery" }, { icon: Shield, label: "100% Secure" }].map(({ icon: Icon, label }) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.primary + "18", border: `1px solid ${T.primary}44`, color: T.primary, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 999 }}>
                <Icon style={{ width: 11, height: 11 }} />{label}
              </span>
            ))}
          </div>
        </div>
      </section>
      <main style={{ flex: 1, padding: "32px 16px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.cardBorder, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Available Vouchers</p>
          {vendor.prices.length === 0 ? (
            <div style={{ border: `1px dashed ${T.cardBorder}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: T.cardBorder }}>No vouchers available right now.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
              {vendor.prices.map((card, index) => {
                const colors = getColors(card.examType, index);
                const img = getCardImage(card.examType, card.imageUrl);
                const disabled = card.count === 0 || isClosed;
                return (
                  <button key={card.examType} onClick={() => !disabled && openCard(card, colors)} disabled={disabled}
                    style={{ background: T.cardBg, border: `1px solid ${disabled ? T.cardBorder + "60" : T.primary + "50"}`, borderRadius: 12, overflow: "hidden", textAlign: "left", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, transition: "transform 0.18s,box-shadow 0.18s" }}
                    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 0 20px ${T.primary}40`; } }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                    data-testid={`vendor-card-${card.examType.toLowerCase()}`}>
                    {img ? (
                      <div style={{ width: "100%", height: 110, overflow: "hidden", background: T.cardBorder + "30" }}>
                        <img src={img} alt={card.examType} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.85)" }} />
                      </div>
                    ) : (
                      <div style={{ width: "100%", height: 110, display: "flex", alignItems: "center", justifyContent: "center", background: disabled ? T.cardBorder + "20" : colors.gradient, opacity: disabled ? 0.5 : 0.9 }}>
                        <CreditCard style={{ width: 38, height: 38, color: disabled ? T.cardBorder : "rgba(255,255,255,0.85)" }} />
                      </div>
                    )}
                    <div style={{ padding: "12px 14px" }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{card.examType}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 19, fontWeight: 900, color: disabled ? T.cardBorder : T.primary }}>GHC {card.price}</span>
                        {card.count === 0 ? <span style={{ fontSize: 10, background: "#dc262630", color: "#f87171", padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>Sold Out</span>
                          : <span style={{ fontSize: 11, background: T.primary + "22", color: T.primary, padding: "2px 8px", borderRadius: 999, fontWeight: 700 }}>{card.count} left</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <footer style={{ background: "#000", borderTop: `1px solid ${T.cardBorder}40`, padding: "22px 16px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 4 }}>
          <img src={alltekseLogo} alt="AllTekSE" style={{ height: 22, objectFit: "contain", borderRadius: 3, opacity: 0.5 }} />
          <span style={{ fontSize: 12, color: T.cardBorder }}>Powered by AllTekSE e-Voucher</span>
        </div>
        <p style={{ fontSize: 11, color: T.cardBorder, opacity: 0.5 }}>© 2025 ALLTEK SOLUTIONS &amp; ENGINEERING</p>
      </footer>
      {purchaseDialog}
    </div>
  );
}
