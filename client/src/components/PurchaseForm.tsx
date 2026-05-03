import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Phone, Lock, MessageCircle, Zap, GraduationCap, MapPin, FileEdit, Search, CreditCard, Loader2, CheckCircle, ExternalLink, Star, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import alltekseLogo from "@assets/alltekse_1777780378035.png";
import mtnLogo from "@assets/republic-bank-mtn-momo_1763209941271.jpg";
import telecelLogo from "@assets/images (1)_1763209941547.png";
import airtelTigoLogo from "@assets/airteltigo_1763209941612.jpg";
import visaLogo from "@assets/images (2)_1763209941664.png";
import studentsBanner from "@assets/generated_images/Successful_African_students_celebrating_101e4f92.png";

import beceCardImage from "@assets/IMG-20260503-WA0021_1777811282955.jpg";
import wassceCardImage from "@assets/IMG-20260503-WA0022_1777811293981.jpg";

const DEFAULT_CARD_IMAGES: Record<string, string> = {
  "BECE": beceCardImage,
  "WASSCE": wassceCardImage,
};

function getCardImage(examType: string, imageUrl: string | null): string | null {
  if (imageUrl) return imageUrl;
  return DEFAULT_CARD_IMAGES[examType] ?? null;
}

interface PurchaseFormProps {
  onSubmit: (data: { email: string; phone: string; examType: string; quantity: number }) => void;
  isLoading?: boolean;
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
  { gradient: "linear-gradient(135deg, #d946ef, #a855f7)", borderColor: "#f0abfc", accentColor: "#d946ef" },
  { gradient: "linear-gradient(135deg, #84cc16, #16a34a)", borderColor: "#bef264", accentColor: "#84cc16" },
];

function getCardColors(examType: string, index: number) {
  return CARD_COLORS[examType] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

interface CardType {
  examType: string;
  count: number;
  price: number;
  imageUrl: string | null;
}

const UNIVERSITIES = [
  { name: "University of Ghana", short: "UG", city: "Legon", url: "https://admissions.ug.edu.gh/", color: "#7c3aed" },
  { name: "KNUST", short: "KN", city: "Kumasi", url: "https://apps.knust.edu.gh/admissions/apply/", color: "#2563eb" },
  { name: "UCC", short: "UC", city: "Cape Coast", url: "http://admissionlist.ucc.edu.gh/", color: "#0d9488" },
  { name: "UPSA", short: "UP", city: "Accra", url: "https://upsasip.com/adm-area", color: "#4f46e5" },
  { name: "Central University", short: "CU", city: "Accra", url: "https://central.edu.gh/online", color: "#db2777" },
  { name: "Ashesi University", short: "AU", city: "Berekuso", url: "https://expresspaygh.com/ashesi", color: "#d97706" },
];

export default function PurchaseForm({ onSubmit, isLoading = false }: PurchaseFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [maxQty, setMaxQty] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(20);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<{ gradient: string; borderColor: string; accentColor: string } | null>(null);

  const { data: cardTypes, isLoading: cardTypesLoading } = useQuery<CardType[]>({
    queryKey: ["/api/card-types"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, phone, examType: selectedType, quantity });
  };

  const handleCardClick = (card: CardType, colors: { gradient: string; borderColor: string; accentColor: string }) => {
    setSelectedType(card.examType);
    setSelectedPrice(card.price);
    setSelectedImage(getCardImage(card.examType, card.imageUrl));
    setSelectedColors(colors);
    setMaxQty(Math.min(card.count, 200));
    setQuantity(1);
    setEmail("");
    setPhone("");
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 border border-slate-200 px-3 py-2 rounded-full transition-colors"
              data-testid="link-blog"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Edu News
            </Link>
            <Link
              href="/vendor/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 border border-slate-200 px-3 py-2 rounded-full transition-colors"
              data-testid="link-vendor-portal"
            >
              <FileEdit className="w-3.5 h-3.5" />
              Sell Vouchers
            </Link>
            <Link
              href="/retrieve-voucher"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-full transition-colors"
              data-testid="link-retrieve-voucher"
            >
              <Search className="w-3.5 h-3.5" />
              Lost Voucher?
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative w-full h-56 md:h-80 overflow-hidden" data-testid="section-hero-banner">
        <img
          src={studentsBanner}
          alt="Students Celebrating"
          className="w-full h-full object-cover object-center scale-105"
          data-testid="img-students-banner"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(76,29,149,0.88) 0%, rgba(30,58,138,0.75) 50%, rgba(13,148,136,0.82) 100%)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 gap-3 md:gap-5">
          <div className="space-y-1 md:space-y-2">
            <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-white/70">Ghana's #1 e-Voucher Platform</p>
            <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-2xl leading-tight" data-testid="text-hero-title">
              Your Success<br className="hidden md:block" /> Starts Here
            </h2>
            <p className="text-sm md:text-lg text-white/90 font-medium drop-shadow-md max-w-md mx-auto">
              Purchase WAEC & university vouchers instantly — delivered straight to your phone.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {[
              { icon: Zap, label: "Instant SMS Delivery" },
              { icon: Shield, label: "100% Secure" },
              { icon: Star, label: "Trusted by Thousands" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOUCHER CARDS ── */}
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Section heading */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-purple-400" />
              <CreditCard className="w-4 h-4 text-purple-500" />
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-purple-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Available Vouchers</h2>
            <p className="text-sm text-slate-500 font-medium">Tap a card below to purchase instantly</p>
          </div>

          {/* Cards grid */}
          {cardTypesLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-32" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cardTypes && cardTypes.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              {cardTypes.map((card, index) => {
                const colors = getCardColors(card.examType, index);
                const soldOut = card.count === 0;
                return (
                  <button
                    key={card.examType}
                    type="button"
                    onClick={() => !soldOut && handleCardClick(card, colors)}
                    disabled={soldOut}
                    className={`group relative text-left rounded-xl overflow-hidden border transition-all duration-200 ${
                      soldOut
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                        : "bg-white border-slate-200 hover-elevate shadow-md hover:shadow-xl hover:-translate-y-0.5"
                    }`}
                    data-testid={`card-type-${card.examType.toLowerCase()}`}
                  >
                    {/* Top accent bar */}
                    {!soldOut && (
                      <div className="h-1 w-full" style={{ background: colors.gradient }} />
                    )}

                    {/* Image / placeholder */}
                    {(() => { const img = getCardImage(card.examType, card.imageUrl); return img ? (
                      <div className="w-full h-28 md:h-36 overflow-hidden bg-slate-100">
                        <img
                          src={img}
                          alt={card.examType}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          data-testid={`img-card-${card.examType.toLowerCase()}`}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full h-28 md:h-36 flex items-center justify-center"
                        style={{ background: soldOut ? "#f1f5f9" : colors.gradient }}
                      >
                        <CreditCard className={`w-10 h-10 md:w-12 md:h-12 ${soldOut ? "text-slate-300" : "text-white/80"}`} />
                      </div>
                    ); })()}

                    {/* Card info */}
                    <div className="p-3 md:p-4 space-y-2">
                      <h3 className="text-sm md:text-base font-bold text-slate-800 leading-snug">{card.examType}</h3>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-lg md:text-xl font-black"
                          style={{ color: soldOut ? "#94a3b8" : colors.accentColor }}
                        >
                          GHC {card.price}
                        </span>
                        {soldOut ? (
                          <Badge variant="destructive" className="text-[10px] px-1.5">Sold Out</Badge>
                        ) : (
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: `${colors.accentColor}18`, color: colors.accentColor }}
                          >
                            {card.count} left
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-500">
                  No voucher cards are currently available. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* ── PURCHASE DIALOG ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[92vh] overflow-y-auto p-0" data-testid="dialog-purchase-form">
          {/* Dialog header with gradient */}
          <div
            className="p-6 text-white space-y-1"
            style={{ background: selectedColors?.gradient || "linear-gradient(135deg, #7c3aed, #3b82f6)" }}
          >
            {selectedImage ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg mb-3 border-2 border-white/30">
                <img src={selectedImage} alt={selectedType} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-3 shadow-inner border border-white/30">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
            )}
            <DialogTitle className="text-xl font-black text-white" data-testid="text-dialog-title">
              Purchase {selectedType}
            </DialogTitle>
            <DialogDescription className="text-white/80 text-sm" data-testid="text-dialog-description">
              Fill in your details to receive your voucher instantly via SMS.
            </DialogDescription>
            <div className="pt-1">
              <span className="inline-block bg-white/20 border border-white/30 text-white text-sm font-bold px-3 py-1 rounded-full">
                GHC {selectedPrice}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dialog-phone" className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="dialog-phone"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-purple-500"
                  required
                  data-testid="input-phone"
                />
              </div>
              <p className="text-xs text-slate-400">Voucher PIN will be sent to this number via SMS</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dialog-email" className="text-sm font-semibold text-slate-700">
                Email Address <span className="text-xs font-normal text-slate-400">(Optional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="dialog-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-purple-500"
                  data-testid="input-email"
                />
              </div>
              <p className="text-xs text-slate-400">Leave blank for SMS-only delivery</p>
            </div>

            {/* Quantity selector */}
            {maxQty > 1 && (
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700">
                  Quantity <span className="text-xs font-normal text-slate-400">(max {maxQty})</span>
                </Label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    data-testid="button-qty-minus"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-2xl font-black text-slate-800" data-testid="text-quantity">{quantity}</span>
                    <p className="text-xs text-slate-400 font-medium">
                      Total: GHC {selectedPrice * quantity}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    data-testid="button-qty-plus"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                className="w-full h-12 text-base font-bold shadow-lg text-white border-0"
                style={{
                  background: selectedColors?.gradient || "linear-gradient(135deg, #7c3aed, #3b82f6)",
                  opacity: (isLoading || !phone || !selectedType) ? 0.6 : 1,
                }}
                disabled={isLoading || !phone || !selectedType}
                data-testid="button-pay"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Pay GHC {selectedPrice * quantity} — Secure Checkout
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secured & processed by <span className="font-semibold text-slate-700">Paystack</span></span>
              </div>

              <div className="pt-1 space-y-2">
                <p className="text-xs font-semibold text-center text-slate-500 uppercase tracking-wide">Payment Methods</p>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { src: mtnLogo, alt: "MTN MoMo", testId: "payment-mtn" },
                    { src: telecelLogo, alt: "Telecel Cash", testId: "payment-telecel" },
                    { src: airtelTigoLogo, alt: "AirtelTigo", testId: "payment-airteltigo" },
                    { src: visaLogo, alt: "Visa", testId: "payment-visa" },
                  ].map(({ src, alt, testId }) => (
                    <div key={testId} className="bg-white border border-slate-100 rounded-lg p-1.5 shadow-sm" data-testid={testId}>
                      <img src={src} alt={alt} className="w-full h-7 object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── UNIVERSITY PORTALS ── */}
      <section className="px-4 py-10 md:py-14 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 mb-1">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-400" />
              <GraduationCap className="w-4 h-4 text-blue-500" />
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-400" />
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">University Portals</h2>
            <p className="text-sm text-slate-500 font-medium">Quick access to Ghana's top universities</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {UNIVERSITIES.map((uni) => (
              <a
                key={uni.short}
                href={uni.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 md:p-4 bg-white border border-slate-200 rounded-xl hover-elevate transition-all shadow-sm hover:shadow-md"
                data-testid={`link-university-${uni.short.toLowerCase()}`}
              >
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-sm"
                  style={{ background: uni.color }}
                >
                  {uni.short}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate leading-snug group-hover:text-purple-700 transition-colors">{uni.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{uni.city}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="px-4 py-10 md:py-14 border-t border-slate-100" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 100%)" }}>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Need More Help?</h2>
            <p className="text-sm text-slate-500 font-medium">We offer additional services to support your journey</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <FileEdit className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-800">Form Filling Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <p className="text-sm text-slate-500">Need help with your university application? Our team is ready to assist you.</p>
                <div className="space-y-2">
                  <a href="tel:+233593260440" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-purple-600 transition-colors" data-testid="link-form-services">
                    <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    0593260440
                  </a>
                  <a href="https://wa.me/233593260440" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    WhatsApp Us
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-800">Visit Our Shop</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <p className="text-sm font-bold text-slate-700">Tech Junction</p>
                  <p className="text-sm text-slate-400">Kumasi, Ghana</p>
                </div>
                <div className="space-y-2">
                  <a href="tel:+233593260440" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-teal-600 transition-colors">
                    <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    0593260440
                  </a>
                  <a href="https://wa.me/233593260440" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    WhatsApp Us
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-white px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={alltekseLogo} alt="AllTekSE Logo" className="h-8 w-auto object-contain rounded-md" />
              <div>
                <p className="text-sm font-bold text-white">AllTekSE e-Voucher</p>
                <p className="text-xs text-slate-400">Your Trusted e-Voucher Store</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
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

          <div className="border-t border-slate-800 pt-4 flex items-center justify-between text-xs text-slate-500">
            <p data-testid="text-powered-by">© 2025 ALLTEK SOLUTIONS & ENGINEERING</p>
            <a href="/admin" className="hover:text-slate-300 transition-colors" data-testid="link-admin">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
