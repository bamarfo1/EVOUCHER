import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone, Mail, Lock, Loader2, Shield, CreditCard, Store,
  Search, Minus, Plus, Star, Zap, AlertCircle, MessageCircle
} from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";
import mtnLogo from "@assets/republic-bank-mtn-momo_1763209941271.jpg";
import telecelLogo from "@assets/images (1)_1763209941547.png";
import airtelTigoLogo from "@assets/airteltigo_1763209941612.jpg";
import visaLogo from "@assets/images (2)_1763209941664.png";
import beceCardImage from "@assets/IMG-20260503-WA0021_1777811282955.jpg";
import wassceCardImage from "@assets/IMG-20260503-WA0022_1777811293981.jpg";
import { Link } from "wouter";

const HARDCODED_CARD_IMAGES: Record<string, string> = {
  "BECE": beceCardImage,
  "WASSCE": wassceCardImage,
};
function getCardImage(examType: string, imageUrl: string | null): string | null {
  if (HARDCODED_CARD_IMAGES[examType]) return HARDCODED_CARD_IMAGES[examType];
  return imageUrl ?? null;
}

interface VendorInfo {
  name: string;
  storeName: string;
  contactNumber: string;
  slug: string;
  status?: string;
  prices: {
    examType: string;
    price: number;
    basePrice: number;
    count: number;
    imageUrl: string | null;
  }[];
}

const CARD_COLORS: Record<string, { gradient: string; borderColor: string; accentColor: string }> = {
  "BECE": { gradient: "linear-gradient(135deg, #10b981, #0d9488)", borderColor: "#6ee7b7", accentColor: "#10b981" },
  "WASSCE": { gradient: "linear-gradient(135deg, #3b82f6, #4f46e5)", borderColor: "#93c5fd", accentColor: "#3b82f6" },
};
const DEFAULT_COLORS = [
  { gradient: "linear-gradient(135deg, #a855f7, #7c3aed)", borderColor: "#d8b4fe", accentColor: "#a855f7" },
  { gradient: "linear-gradient(135deg, #f43f5e, #ec4899)", borderColor: "#fda4af", accentColor: "#f43f5e" },
  { gradient: "linear-gradient(135deg, #f59e0b, #ea580c)", borderColor: "#fcd34d", accentColor: "#f59e0b" },
  { gradient: "linear-gradient(135deg, #06b6d4, #0284c7)", borderColor: "#67e8f9", accentColor: "#06b6d4" },
];
function getColors(examType: string, index: number) {
  return CARD_COLORS[examType] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

export default function VendorPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

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
        body: JSON.stringify({
          phone,
          email,
          examType: selected.examType,
          quantity,
          vendorSlug: slug,
        }),
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

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                {vendor.name}'s Store
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">
                Powered by AllTekSE e-Voucher
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://wa.me/${vendor.contactNumber.replace(/[\s\+\-\(\)]/g, '').replace(/^0/, '233')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-full transition-colors"
              data-testid="link-vendor-whatsapp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Support
            </a>
            <a
              href={`tel:${vendor.contactNumber}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white px-3 py-2 rounded-full transition-colors"
              data-testid="link-vendor-contact"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
            <Link
              href={`/retrieve-voucher?vendor=${slug}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-full transition-colors"
              data-testid="link-retrieve-voucher"
            >
              <Search className="w-3.5 h-3.5" />
              Lost Voucher?
            </Link>
          </div>
        </div>
      </header>

      {/* Closed-for-payout banner */}
      {vendor.status === "closed_for_payout" && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-amber-800" data-testid="banner-closed-for-payout">
            This store is temporarily closed for weekly payout processing. Please check back shortly.
          </p>
        </div>
      )}

      {/* Vendor Banner */}
      <section className="bg-gradient-to-r from-purple-700 via-blue-700 to-teal-600 px-4 py-10 text-white text-center">
        <div className="max-w-xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            <Star className="w-3.5 h-3.5" />
            Authorised AllTekSE Vendor
          </div>
          <h2 className="text-3xl md:text-4xl font-black drop-shadow-lg">{vendor.name}</h2>
          <p className="text-white/80 text-sm font-medium">
            Purchase WAEC & exam vouchers — instant SMS delivery to your phone.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {[
              { icon: Zap, label: "Instant Delivery" },
              { icon: Shield, label: "100% Secure" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/15 border border-white/20 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cards */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Available Vouchers</h2>
            <p className="text-sm text-slate-500 font-medium">Tap a card below to purchase instantly</p>
          </div>

          {vendor.prices.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-500">No vouchers available right now. Check back soon.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {vendor.prices.map((card, index) => {
                const colors = getColors(card.examType, index);
                const soldOut = card.count === 0;
                return (
                  <button
                    key={card.examType}
                    type="button"
                    onClick={() => !soldOut && vendor.status !== "closed_for_payout" && openCard(card, colors)}
                    disabled={soldOut || vendor.status === "closed_for_payout"}
                    className={`group relative text-left rounded-xl overflow-hidden border transition-all duration-200 ${
                      soldOut || vendor.status === "closed_for_payout"
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                        : "bg-white border-slate-200 hover-elevate shadow-md hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                    data-testid={`vendor-card-${card.examType.toLowerCase()}`}
                  >
                    {!soldOut && <div className="h-1 w-full" style={{ background: colors.gradient }} />}
                    {(() => { const img = getCardImage(card.examType, card.imageUrl); return img ? (
                      <div className="w-full h-28 md:h-36 overflow-hidden bg-slate-100">
                        <img src={img} alt={card.examType} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-28 md:h-36 flex items-center justify-center" style={{ background: soldOut ? "#f1f5f9" : colors.gradient }}>
                        <CreditCard className={`w-10 h-10 md:w-12 md:h-12 ${soldOut ? "text-slate-300" : "text-white/80"}`} />
                      </div>
                    ); })()}
                    <div className="p-3 md:p-4 space-y-2">
                      <h3 className="text-sm md:text-base font-bold text-slate-800 leading-snug">{card.examType}</h3>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-lg md:text-xl font-black" style={{ color: soldOut ? "#94a3b8" : colors.accentColor }}>
                          GHC {card.price}
                        </span>
                        {soldOut ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5">Sold Out</Badge>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${colors.accentColor}18`, color: colors.accentColor }}>
                            {card.count} left
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Purchase Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-0" data-testid="dialog-vendor-purchase">
          <div className="p-6 text-white space-y-1" style={{ background: selectedColors?.gradient || "linear-gradient(135deg, #7c3aed, #3b82f6)" }}>
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
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">
                {errorMsg}
              </div>
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
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg text-white border-0"
                style={{ background: selectedColors?.gradient || "linear-gradient(135deg, #7c3aed, #3b82f6)", opacity: (isLoading || !phone) ? 0.6 : 1 }}
                disabled={isLoading || !phone}
                data-testid="button-vendor-pay"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
                ) : (
                  <span className="flex items-center gap-2"><Lock className="w-4 h-4" />Pay GHC {selected ? selected.price * quantity : 0} — Secure Checkout</span>
                )}
              </Button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secured & processed by <span className="font-semibold text-slate-700">Paystack</span></span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { src: mtnLogo, alt: "MTN MoMo" },
                  { src: telecelLogo, alt: "Telecel Cash" },
                  { src: airtelTigoLogo, alt: "AirtelTigo" },
                  { src: visaLogo, alt: "Visa" },
                ].map(({ src, alt }) => (
                  <div key={alt} className="bg-white border border-slate-100 rounded-lg p-1.5 shadow-sm">
                    <img src={src} alt={alt} className="w-full h-7 object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-md mx-auto space-y-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <img src={alltekseLogo} alt="AllTekSE" className="h-7 w-auto object-contain rounded opacity-80" />
            <span className="text-xs text-slate-400 font-medium">Powered by AllTekSE e-Voucher</span>
          </div>
          <p className="text-xs text-slate-500">© 2025 ALLTEK SOLUTIONS & ENGINEERING</p>
        </div>
      </footer>
    </div>
  );
}
