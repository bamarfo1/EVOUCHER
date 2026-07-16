import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Phone, Loader2, Store, ArrowLeft, CheckCircle2 } from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

export default function VendorForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendor/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSent(true);
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
          <Link href="/vendor/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 border border-slate-200 px-3 py-2 rounded-full transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Reset Password</h2>
            <p className="text-sm text-slate-500 mt-1">We'll send a reset link to your phone via SMS</p>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-6">
              {sent ? (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-slate-800">Reset link sent!</p>
                  <p className="text-sm text-slate-500">
                    If an account exists for <span className="font-medium text-slate-700">{phone}</span>, you'll receive an SMS with a password reset link shortly.
                  </p>
                  <Link href="/vendor/login">
                    <Button variant="outline" className="w-full mt-2">Back to Login</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="0599188713 or +233599188713"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-400">Enter the phone number linked to your vendor account</p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md shadow-purple-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Sending...</span>
                    ) : "Send Reset Link"}
                  </Button>

                  <p className="text-center text-sm text-slate-500">
                    Remembered it?{" "}
                    <Link href="/vendor/login" className="font-semibold text-purple-700 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
