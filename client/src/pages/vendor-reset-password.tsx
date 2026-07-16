import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, Loader2, Store, CheckCircle2 } from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

function useSearchParam(key: string): string | null {
  const search = window.location.search;
  const params = new URLSearchParams(search);
  return params.get(key);
}

export default function VendorResetPassword() {
  const [, setLocation] = useLocation();
  const token = useSearchParam("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token. Please request a new reset link.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/vendor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setDone(true);
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
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">New Password</h2>
            <p className="text-sm text-slate-500 mt-1">Choose a strong new password for your account</p>
          </div>

          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-6">
              {!token ? (
                <div className="text-center space-y-4 py-2">
                  <p className="text-sm text-red-600 font-medium">Invalid reset link. Please request a new one.</p>
                  <Link href="/vendor/forgot-password">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
                      Request Reset Link
                    </Button>
                  </Link>
                </div>
              ) : done ? (
                <div className="text-center space-y-4 py-2">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="font-semibold text-slate-800">Password reset successfully!</p>
                  <p className="text-sm text-slate-500">You can now log in with your new password.</p>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0"
                    onClick={() => setLocation("/vendor/login")}
                  >
                    Go to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg font-medium">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={form.newPassword}
                        onChange={set("newPassword")}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Re-enter your password"
                        value={form.confirmPassword}
                        onChange={set("confirmPassword")}
                        className="pl-10 pr-10"
                        required
                        minLength={6}
                      />
                      <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-md shadow-purple-200"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Resetting...</span>
                    ) : "Reset Password"}
                  </Button>

                  <p className="text-center text-sm text-slate-500">
                    <Link href="/vendor/forgot-password" className="font-semibold text-purple-700 hover:underline">
                      Request a new link
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
