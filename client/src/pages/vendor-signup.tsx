import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, Lock, Eye, EyeOff, Loader2, CreditCard, User, Store, ArrowLeft } from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

export default function VendorSignup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    momoNumber: "",
    momoName: "",
    contactNumber: "",
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/vendor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          password: form.password,
          momoNumber: form.momoNumber,
          momoName: form.momoName,
          contactNumber: form.contactNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setLocation("/vendor/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={alltekseLogo} alt="AllTekSE Logo" className="h-10 w-auto object-contain rounded-lg" />
            <div>
              <h1 className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                AllTekSE e-Voucher
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Vendor Portal</p>
            </div>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 border border-slate-200 px-3 py-2 rounded-full transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Become a Vendor</h2>
            <p className="text-sm text-slate-500 mt-1">Set up your shop and start selling vouchers</p>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium" data-testid="text-signup-error">
                    {error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+233 XX XXX XXXX"
                      value={form.phone}
                      onChange={set("phone")}
                      className="pl-10"
                      required
                      data-testid="input-vendor-phone"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={set("password")}
                      className="pl-10 pr-10"
                      required
                      data-testid="input-vendor-password"
                    />
                    <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Repeat Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={form.confirmPassword}
                      onChange={set("confirmPassword")}
                      className="pl-10"
                      required
                      data-testid="input-vendor-confirm-password"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">MoMo Payment Details</p>

                  <div className="space-y-1.5">
                    <Label htmlFor="momoNumber" className="text-sm font-semibold text-slate-700">MoMo Number <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="momoNumber"
                        type="tel"
                        placeholder="Your MoMo number"
                        value={form.momoNumber}
                        onChange={set("momoNumber")}
                        className="pl-10"
                        required
                        data-testid="input-vendor-momo-number"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="momoName" className="text-sm font-semibold text-slate-700">MoMo Account Name <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="momoName"
                        type="text"
                        placeholder="Name on MoMo account"
                        value={form.momoName}
                        onChange={set("momoName")}
                        className="pl-10"
                        required
                        data-testid="input-vendor-momo-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="contactNumber" className="text-sm font-semibold text-slate-700">Contact Number for Customers <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="contactNumber"
                        type="tel"
                        placeholder="Number shown to customers"
                        value={form.contactNumber}
                        onChange={set("contactNumber")}
                        className="pl-10"
                        required
                        data-testid="input-vendor-contact"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md shadow-purple-200"
                  disabled={isLoading}
                  data-testid="button-vendor-register"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating Account...</span>
                  ) : (
                    "Create Vendor Account"
                  )}
                </Button>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/vendor/login" className="font-semibold text-purple-700 hover:underline" data-testid="link-vendor-login">
                    Log In
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
