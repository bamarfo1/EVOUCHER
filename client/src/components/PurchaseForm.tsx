import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Phone, Lock, MessageCircle, Zap, GraduationCap, MapPin, FileEdit, Search, CreditCard, Loader2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import alltekseLogo from "@assets/alltekse_1777780378035.png";
import mtnLogo from "@assets/republic-bank-mtn-momo_1763209941271.jpg";
import telecelLogo from "@assets/images (1)_1763209941547.png";
import airtelTigoLogo from "@assets/airteltigo_1763209941612.jpg";
import visaLogo from "@assets/images (2)_1763209941664.png";
import studentsBanner from "@assets/generated_images/Successful_African_students_celebrating_101e4f92.png";

interface PurchaseFormProps {
  onSubmit: (data: { email: string; phone: string; examType: string }) => void;
  isLoading?: boolean;
}

const CARD_COLORS: Record<string, { gradient: string; borderColor: string }> = {
  "BECE": { gradient: "linear-gradient(to bottom right, #10b981, #0d9488)", borderColor: "#6ee7b7" },
  "WASSCE": { gradient: "linear-gradient(to bottom right, #3b82f6, #4f46e5)", borderColor: "#93c5fd" },
};

const DEFAULT_COLORS = [
  { gradient: "linear-gradient(to bottom right, #a855f7, #7c3aed)", borderColor: "#d8b4fe" },
  { gradient: "linear-gradient(to bottom right, #f43f5e, #ec4899)", borderColor: "#fda4af" },
  { gradient: "linear-gradient(to bottom right, #f59e0b, #ea580c)", borderColor: "#fcd34d" },
  { gradient: "linear-gradient(to bottom right, #06b6d4, #0284c7)", borderColor: "#67e8f9" },
  { gradient: "linear-gradient(to bottom right, #d946ef, #a855f7)", borderColor: "#f0abfc" },
  { gradient: "linear-gradient(to bottom right, #84cc16, #16a34a)", borderColor: "#bef264" },
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

export default function PurchaseForm({ onSubmit, isLoading = false }: PurchaseFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [selectedPrice, setSelectedPrice] = useState(20);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: cardTypes, isLoading: cardTypesLoading } = useQuery<CardType[]>({
    queryKey: ["/api/card-types"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, phone, examType: selectedType });
  };

  const handleCardClick = (card: CardType) => {
    setSelectedType(card.examType);
    setSelectedPrice(card.price);
    setSelectedImage(card.imageUrl);
    setEmail("");
    setPhone("");
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/20 flex flex-col">
      <header className="py-5 px-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg">
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-center">
            <img 
              src={alltekseLogo} 
              alt="AllTekSE Logo" 
              className="h-16 w-auto object-contain rounded-xl shadow-xl"
              data-testid="img-alltekse-logo"
            />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent" data-testid="text-site-title">
              AllTekSE e-Voucher
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Your Trusted e-Voucher Store</p>
            <Link 
              href="/retrieve-voucher"
              className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors hover-elevate px-3 py-1.5 rounded-lg"
              data-testid="link-retrieve-voucher"
            >
              <Search className="w-4 h-4" />
              Lost Your Voucher? Retrieve It Here
            </Link>
          </div>
        </div>
      </header>

      <section className="relative w-full h-48 md:h-72 overflow-hidden" data-testid="section-hero-banner">
        <img 
          src={studentsBanner} 
          alt="Students Celebrating" 
          className="w-full h-full object-cover"
          data-testid="img-students-banner"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-blue-900/70 to-teal-900/80"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl space-y-2 md:space-y-4">
            <h2 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-2xl" data-testid="text-hero-title">
              Your Success Starts Here
            </h2>
            <p className="text-sm md:text-lg text-white/95 font-medium drop-shadow-lg">
              Purchase your e-Voucher instantly and securely!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 pt-2 md:pt-4">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold shadow-lg">
                <Zap className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Instant Delivery
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold shadow-lg">
                <Shield className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                100% Secure
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold shadow-lg">
                <ShoppingBag className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Trusted by Thousands
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-4 md:mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 px-4 py-2 md:px-6 md:py-3 rounded-full mb-2 shadow-lg">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
              <h2 className="text-lg md:text-xl font-bold text-white">Available Vouchers</h2>
            </div>
            <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Tap a voucher card to purchase</p>
          </div>

          {cardTypesLoading ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="overflow-visible">
                  <CardContent className="p-3 md:p-5">
                    <Skeleton className="w-full h-20 rounded-lg mb-3" />
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : cardTypes && cardTypes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {cardTypes.map((card, index) => {
                const colors = getCardColors(card.examType, index);
                return (
                  <button
                    key={card.examType}
                    type="button"
                    onClick={() => card.count > 0 && handleCardClick(card)}
                    disabled={card.count === 0}
                    className={`relative text-left rounded-md border-2 transition-all duration-200 overflow-visible ${
                      card.count === 0
                        ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
                        : 'hover-elevate shadow-md bg-white dark:bg-slate-800'
                    } p-3 md:p-4`}
                    style={{ borderColor: card.count === 0 ? undefined : colors.borderColor }}
                    data-testid={`card-type-${card.examType.toLowerCase()}`}
                  >
                    {card.imageUrl ? (
                      <div className="w-full h-20 md:h-28 rounded-md overflow-hidden mb-2 md:mb-3 bg-slate-100 dark:bg-slate-700">
                        <img 
                          src={card.imageUrl} 
                          alt={card.examType}
                          className="w-full h-full object-cover"
                          data-testid={`img-card-${card.examType.toLowerCase()}`}
                        />
                      </div>
                    ) : (
                      <div 
                        className="w-full h-20 md:h-28 rounded-md flex items-center justify-center mb-2 md:mb-3 shadow-inner"
                        style={{ background: colors.gradient }}
                      >
                        <CreditCard className="w-8 h-8 md:w-10 md:h-10 text-white/80" />
                      </div>
                    )}
                    <h3 className="text-xs md:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight min-h-[2rem] flex items-center">
                      {card.examType}
                    </h3>
                    <div className="flex items-center justify-between gap-1 mt-1">
                      <span className="text-base md:text-lg font-extrabold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                        GHC {card.price}
                      </span>
                      <Badge variant={card.count > 0 ? "secondary" : "destructive"} className="text-[10px] md:text-xs px-1.5">
                        {card.count > 0 ? `${card.count} left` : "Sold out"}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 md:p-8 text-center">
                <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No voucher cards are currently available. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" data-testid="dialog-purchase-form">
          <DialogHeader className="text-center space-y-3 pb-2">
            {selectedImage ? (
              <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden shadow-xl">
                <img src={selectedImage} alt={selectedType} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Zap className="w-7 h-7 text-white" />
              </div>
            )}
            <DialogTitle className="text-xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent font-bold" data-testid="text-dialog-title">
              Purchase {selectedType} Voucher
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-slate-600 dark:text-slate-400" data-testid="text-dialog-description">
              Complete your details below to receive your voucher instantly.
              <span className="block mt-1 font-semibold text-purple-600 dark:text-purple-400">GHC {selectedPrice} per voucher</span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="dialog-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="dialog-phone"
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
              <Label htmlFor="dialog-email">Email Address <span className="text-muted-foreground text-xs">(Optional)</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="dialog-email"
                  type="email"
                  placeholder="your.email@example.com (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  data-testid="input-email"
                />
              </div>
              <p className="text-xs text-muted-foreground">Leave blank if you prefer SMS delivery only</p>
            </div>

            <div className="pt-3 border-t space-y-3">
              <Button
                type="submit"
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 hover:from-purple-700 hover:via-blue-700 hover:to-teal-700 text-white border-0"
                disabled={isLoading || !phone || !selectedType}
                data-testid="button-pay"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Lock className="w-4 h-4 md:w-5 md:h-5" />
                    Pay GHC {selectedPrice} Now
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Secured by Paystack</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-center bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Available Payment Options</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5" data-testid="payment-mtn">
                    <img src={mtnLogo} alt="MTN MoMo" className="w-full h-7 object-contain" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5" data-testid="payment-telecel">
                    <img src={telecelLogo} alt="Telecel Cash" className="w-full h-7 object-contain" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5" data-testid="payment-airteltigo">
                    <img src={airtelTigoLogo} alt="AirtelTigo" className="w-full h-7 object-contain" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5" data-testid="payment-visa">
                    <img src={visaLogo} alt="Visa" className="w-full h-7 object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <section className="py-8 md:py-12 px-4 bg-gradient-to-b from-white via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 px-4 py-2 md:px-6 md:py-3 rounded-full mb-2 md:mb-3 shadow-lg">
              <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
              <h2 className="text-lg md:text-xl font-bold text-white">University Portals</h2>
            </div>
            <p className="text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Quick access to Ghana's top universities</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <a 
              href="https://admissions.ug.edu.gh/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800 rounded-lg md:rounded-xl p-3 md:p-4 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-ug"
            >
              <h3 className="font-bold text-sm md:text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">University of Ghana</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">UG-Legon</p>
            </a>
            
            <a 
              href="https://apps.knust.edu.gh/admissions/apply/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800 rounded-lg md:rounded-xl p-3 md:p-4 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-knust"
            >
              <h3 className="font-bold text-sm md:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">KNUST</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Kumasi</p>
            </a>
            
            <a 
              href="http://admissionlist.ucc.edu.gh/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-teal-200 dark:border-teal-800 rounded-lg md:rounded-xl p-3 md:p-4 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-ucc"
            >
              <h3 className="font-bold text-sm md:text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">UCC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Cape Coast</p>
            </a>
            
            <a 
              href="https://upsasip.com/adm-area" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-lg md:rounded-xl p-3 md:p-4 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-upsa"
            >
              <h3 className="font-bold text-sm md:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">UPSA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Accra</p>
            </a>
            
            <a 
              href="https://central.edu.gh/online" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-pink-200 dark:border-pink-800 rounded-lg md:rounded-xl p-3 md:p-4 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-central"
            >
              <h3 className="font-bold text-sm md:text-base group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Central University</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Accra</p>
            </a>
            
            <a 
              href="https://expresspaygh.com/ashesi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-800 rounded-lg md:rounded-xl p-3 md:p-4 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-ashesi"
            >
              <h3 className="font-bold text-sm md:text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Ashesi University</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Berekuso</p>
            </a>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 px-4 bg-gradient-to-b from-blue-50/30 via-teal-50/30 to-white dark:from-blue-900/10 dark:via-teal-900/10 dark:to-slate-900 border-t-2 border-purple-200 dark:border-purple-800">
        <div className="max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <Card className="shadow-2xl border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-2 md:pb-3 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                    <FileEdit className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">Form Filling Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Need help with applications? We've got you covered!
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  <a 
                    href="tel:+233593260440" 
                    className="font-semibold hover:text-primary transition-colors"
                    data-testid="link-form-services"
                  >
                    Call: 0593260440
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <a 
                    href="https://wa.me/233593260440" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl border-2 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-2 md:pb-3 bg-gradient-to-br from-teal-50/50 to-blue-50/50 dark:from-teal-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent font-bold">Visit Our Shop</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Tech Junction</p>
                  <p className="text-sm text-muted-foreground">Kumasi, Ghana</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  <a 
                    href="tel:+233593260440" 
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    Call: 0593260440
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  <a 
                    href="https://wa.me/233593260440" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-semibold hover:text-primary transition-colors"
                  >
                    WhatsApp Us
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-6 px-4 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Need Help?</p>
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
          <div className="text-center pt-2 border-t border-purple-200/50 dark:border-purple-800/50 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground" data-testid="text-powered-by">
              Powered by ALLTEK SOLUTIONS & ENGINEERING
            </p>
            <a
              href="/admin"
              className="text-xs text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
              data-testid="link-admin"
            >
              Admin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
