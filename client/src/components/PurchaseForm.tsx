import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Phone, FileText, Lock, MessageCircle, Zap, GraduationCap, MapPin, FileEdit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import waecLogo from "@assets/Buy-WASSCE-Results-Checker-Cards-WAEC-Shortcode.png_1763208493592.png";
import alltekseLogo from "@assets/101-800x600_1763210592506.jpg";
import mtnLogo from "@assets/republic-bank-mtn-momo_1763209941271.jpg";
import telecelLogo from "@assets/images (1)_1763209941547.png";
import airtelTigoLogo from "@assets/airteltigo_1763209941612.jpg";
import visaLogo from "@assets/images (2)_1763209941664.png";
import studentsBanner from "@assets/generated_images/Successful_African_students_celebrating_101e4f92.png";

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-purple-900/20 dark:to-blue-900/20 flex flex-col">
      <header className="py-6 px-4 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-center gap-4">
            <div className="bg-black rounded-xl p-3 shadow-xl">
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
              className="h-16 w-auto object-contain drop-shadow-lg"
              data-testid="img-waec-logo"
            />
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent" data-testid="text-site-title">
              AllTekSE e-Voucher
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">WAEC Result Checker Platform</p>
          </div>
        </div>
      </header>

      {/* Hero Banner Section */}
      <section className="relative w-full h-64 md:h-80 overflow-hidden" data-testid="section-hero-banner">
        <img 
          src={studentsBanner} 
          alt="Successful Students" 
          className="w-full h-full object-cover"
          data-testid="img-students-banner"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-blue-900/70 to-teal-900/80"></div>
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-2xl" data-testid="text-hero-title">
              Your Success Starts Here
            </h2>
            <p className="text-lg md:text-xl text-white/95 font-medium drop-shadow-lg">
              Get your WAEC Result Checker Voucher instantly and unlock your future!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-lg">
                <Zap className="w-4 h-4 mr-2" />
                Instant Delivery
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-lg">
                <Shield className="w-4 h-4 mr-2" />
                100% Secure
              </Badge>
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 text-sm font-semibold shadow-lg">
                <GraduationCap className="w-4 h-4 mr-2" />
                Trusted by Thousands
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-purple-100 dark:border-purple-900/50">
          <CardHeader className="text-center space-y-4 pb-6 bg-gradient-to-br from-purple-50/50 via-blue-50/50 to-teal-50/50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-teal-900/20 rounded-t-lg">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl mb-2 bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent font-bold" data-testid="text-card-title">
                Instant Delivery!
              </CardTitle>
              <CardDescription className="text-base leading-relaxed text-slate-600 dark:text-slate-400" data-testid="text-card-description">
                Once your payment is completed, your WAEC Result Checker Voucher will be sent to you automatically and immediately.
                <span className="block mt-2 font-semibold text-purple-600 dark:text-purple-400">No delays — fast, secure, and convenient.</span>
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
                <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-teal-600 rounded-xl p-6 text-center shadow-xl overflow-hidden">
                  <div className="absolute inset-0 bg-grid-white/10"></div>
                  <p className="text-sm font-semibold text-white/90 mb-1 relative z-10">Price</p>
                  <p className="text-5xl font-extrabold text-white relative z-10" data-testid="text-price">GHC 20</p>
                  <p className="text-xs text-white/80 mt-1 relative z-10">Per Voucher</p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-center bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Available Payment Options</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-3 hover-elevate transition-all shadow-md" data-testid="payment-mtn">
                      <img 
                        src={mtnLogo} 
                        alt="MTN Mobile Money" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-3 hover-elevate transition-all shadow-md" data-testid="payment-telecel">
                      <img 
                        src={telecelLogo} 
                        alt="Telecel Cash" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-3 hover-elevate transition-all shadow-md" data-testid="payment-airteltigo">
                      <img 
                        src={airtelTigoLogo} 
                        alt="AirtelTigo Money" 
                        className="w-full h-12 object-contain"
                      />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-3 hover-elevate transition-all shadow-md" data-testid="payment-visa">
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
                  className="w-full h-16 text-lg font-bold shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 hover:from-purple-700 hover:via-blue-700 hover:to-teal-700 text-white border-0"
                  disabled={isLoading || !email || !phone || !examType}
                  data-testid="button-pay"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Zap className="w-5 h-5 animate-pulse" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Pay GHC 20 Now
                    </span>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Secured by Paystack</span>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* University Links Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-white via-purple-50/30 to-blue-50/30 dark:from-slate-900 dark:via-purple-900/10 dark:to-blue-900/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500 px-6 py-3 rounded-full mb-3 shadow-lg">
              <GraduationCap className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">University Portals</h2>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Quick access to Ghana's top universities</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a 
              href="https://admissions.ug.edu.gh/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-5 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-ug"
            >
              <h3 className="font-bold text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">University of Ghana</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">UG-Legon</p>
            </a>
            
            <a 
              href="https://apps.knust.edu.gh/admissions/apply/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-knust"
            >
              <h3 className="font-bold text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">KNUST</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Kumasi</p>
            </a>
            
            <a 
              href="http://admissionlist.ucc.edu.gh/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-teal-200 dark:border-teal-800 rounded-xl p-5 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-ucc"
            >
              <h3 className="font-bold text-base group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">UCC</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Cape Coast</p>
            </a>
            
            <a 
              href="https://upsasip.com/adm-area" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-xl p-5 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-upsa"
            >
              <h3 className="font-bold text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">UPSA</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Accra</p>
            </a>
            
            <a 
              href="https://central.edu.gh/online" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-pink-200 dark:border-pink-800 rounded-xl p-5 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-central"
            >
              <h3 className="font-bold text-base group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">Central University</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Accra</p>
            </a>
            
            <a 
              href="https://expresspaygh.com/ashesi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-5 hover-elevate transition-all text-center group shadow-lg hover:shadow-2xl"
              data-testid="link-university-ashesi"
            >
              <h3 className="font-bold text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Ashesi University</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Berekuso</p>
            </a>
          </div>
        </div>
      </section>

      {/* Services & Location Section */}
      <section className="py-12 px-4 bg-gradient-to-b from-blue-50/30 via-teal-50/30 to-white dark:from-blue-900/10 dark:via-teal-900/10 dark:to-slate-900 border-t-2 border-purple-200 dark:border-purple-800">
        <div className="max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Form Filling Services */}
            <Card className="shadow-2xl border-2 border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileEdit className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-bold">Form Filling Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Need help with university applications? We've got you covered!
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

            {/* Shop Location */}
            <Card className="shadow-2xl border-2 border-teal-200 dark:border-teal-800">
              <CardHeader className="pb-3 bg-gradient-to-br from-teal-50/50 to-blue-50/50 dark:from-teal-900/20 dark:to-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent font-bold">Visit Our Shop</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Tech Junction</p>
                  <p className="text-sm text-muted-foreground">Kumasi, Ghana</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get instant vouchers, form filling assistance, and all tech services
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="font-semibold">0593260440</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 border-t-2 border-purple-200 dark:border-purple-800 bg-gradient-to-b from-white to-purple-50 dark:from-slate-900 dark:to-purple-900/20">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center space-y-3">
            <p className="text-base font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">Need Help?</p>
            <div className="flex flex-col items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md border border-purple-200 dark:border-purple-800">
                <Mail className="w-4 h-4 text-purple-600" />
                <a href="mailto:support@alltekse.com" className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors" data-testid="link-email">
                  support@alltekse.com
                </a>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-md border border-teal-200 dark:border-teal-800">
                <MessageCircle className="w-4 h-4 text-teal-600" />
                <a 
                  href="https://wa.me/233593260440" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
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
