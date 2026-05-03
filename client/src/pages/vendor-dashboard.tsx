import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store, LogOut, Copy, ExternalLink, TrendingUp, Package,
  DollarSign, Phone, CreditCard, Loader2, Check, Settings, RefreshCw
} from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

interface VendorMe {
  id: string;
  phone: string;
  storeName: string | null;
  momoNumber: string;
  momoName: string;
  contactNumber: string;
  slug: string;
  status: string;
}

interface VendorStats {
  totalSales: number;
  totalRevenue: number;
  byType: { examType: string; count: number; revenue: number }[];
}

interface CardTypeInfo {
  examType: string;
  count: number;
  basePrice: number;
  vendorPrice: number | null;
  imageUrl: string | null;
}

export default function VendorDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [savedField, setSavedField] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: vendor, isLoading: vendorLoading, error: vendorError } = useQuery<VendorMe>({
    queryKey: ["/api/vendor/me"],
    retry: false,
  });

  const { data: cardTypes } = useQuery<CardTypeInfo[]>({
    queryKey: ["/api/vendor/me/card-types"],
    enabled: !!vendor,
  });

  const { data: stats } = useQuery<VendorStats>({
    queryKey: ["/api/vendor/me/stats"],
    enabled: !!vendor,
  });

  useEffect(() => {
    if (vendorError) {
      setLocation("/vendor/login");
    }
  }, [vendorError, setLocation]);

  useEffect(() => {
    if (cardTypes) {
      const initial: Record<string, string> = {};
      cardTypes.forEach((c) => {
        initial[c.examType] = c.vendorPrice !== null ? String(c.vendorPrice) : String(c.basePrice);
      });
      setPrices(initial);
    }
  }, [cardTypes]);

  const savePriceMutation = useMutation({
    mutationFn: async ({ examType, price }: { examType: string; price: number }) => {
      const res = await fetch("/api/vendor/prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, price }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save price");
      return res.json();
    },
    onSuccess: (_, { examType }) => {
      setSavedField(examType);
      setTimeout(() => setSavedField(null), 2000);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me/card-types"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/vendor/logout", { method: "POST" });
    },
    onSuccess: () => setLocation("/vendor/login"),
  });

  if (vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!vendor) return null;

  const vendorPageUrl = `${window.location.origin}/v/${vendor.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(vendorPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={alltekseLogo} alt="AllTekSE" className="h-10 w-auto object-contain rounded-lg" />
            <div>
              <h1 className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                Vendor Dashboard
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">{vendor.storeName || vendor.momoName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 border border-slate-200 px-3 py-2 rounded-full transition-colors">
              <Store className="w-3.5 h-3.5" />
              Main Store
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-vendor-logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full space-y-6">

        {/* Vendor Page URL */}
        <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-2">Your Store Link</p>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex-1 bg-white border border-purple-200 rounded-lg px-4 py-2.5 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate" data-testid="text-vendor-url">{vendorPageUrl}</p>
              </div>
              <Button size="sm" variant="outline" onClick={copyUrl} data-testid="button-copy-vendor-url">
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.open(vendorPageUrl, "_blank")} data-testid="button-open-vendor-page">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Preview
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Share this link with your customers to sell vouchers.</p>
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Total Sales</p>
                  <p className="text-2xl font-black text-slate-800" data-testid="text-total-sales">{stats.totalSales}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Revenue (GHC)</p>
                  <p className="text-2xl font-black text-slate-800" data-testid="text-total-revenue">{stats.totalRevenue}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 col-span-2 md:col-span-1">
              <CardContent className="p-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Card Types Sold</p>
                  <p className="text-2xl font-black text-slate-800">{stats.byType.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Set Prices */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base font-bold">Set Your Prices</CardTitle>
            </div>
            <p className="text-xs text-slate-500">Set prices higher than base to earn profit per card sold</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!cardTypes ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : cardTypes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No card types available in stock.</p>
            ) : (
              cardTypes.map((card) => {
                const myPrice = parseInt(prices[card.examType] || String(card.basePrice), 10);
                const profit = myPrice - card.basePrice;
                return (
                  <div key={card.examType} className="flex items-center gap-3 flex-wrap border border-slate-100 rounded-lg p-4 bg-slate-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{card.examType}</p>
                        <Badge variant="outline" className="text-[10px] px-1.5">{card.count} in stock</Badge>
                        <span className="text-[11px] text-slate-400">Base: GHC {card.basePrice}</span>
                      </div>
                      {profit > 0 && (
                        <p className="text-xs text-emerald-600 font-semibold mt-0.5" data-testid={`text-profit-${card.examType}`}>
                          Profit: GHC {profit} per card
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">GHC</span>
                        <Input
                          type="number"
                          min={card.basePrice}
                          value={prices[card.examType] ?? card.basePrice}
                          onChange={(e) => setPrices((p) => ({ ...p, [card.examType]: e.target.value }))}
                          className="pl-12 w-28 font-bold"
                          data-testid={`input-price-${card.examType}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => savePriceMutation.mutate({ examType: card.examType, price: myPrice })}
                        disabled={savePriceMutation.isPending || myPrice < card.basePrice}
                        data-testid={`button-save-price-${card.examType}`}
                      >
                        {savedField === card.examType ? (
                          <span className="flex items-center gap-1.5 text-emerald-600"><Check className="w-3.5 h-3.5" />Saved</span>
                        ) : savePriceMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : "Save"}
                      </Button>
                    </div>
                    {myPrice < card.basePrice && (
                      <p className="w-full text-xs text-red-500 font-medium">Price cannot be lower than base price (GHC {card.basePrice})</p>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base font-bold">Account Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Store Name", value: vendor.storeName || vendor.momoName },
              { label: "Phone", value: vendor.phone },
              { label: "MoMo Number", value: vendor.momoNumber },
              { label: "MoMo Name", value: vendor.momoName },
              { label: "Customer Contact", value: vendor.contactNumber },
              { label: "Store Slug", value: vendor.slug },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <span className="text-sm font-bold text-slate-800" data-testid={`text-account-${label.replace(/\s/g, "-").toLowerCase()}`}>{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sales breakdown */}
        {stats && stats.byType.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-base font-bold">Sales Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.byType.map((row) => (
                  <div key={row.examType} className="flex items-center justify-between gap-2 py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{row.examType}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{row.count} sold</span>
                      <span className="font-bold text-emerald-600">GHC {row.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
