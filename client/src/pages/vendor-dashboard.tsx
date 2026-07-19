import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Store, LogOut, Copy, ExternalLink, TrendingUp, Package,
  DollarSign, Phone, CreditCard, Loader2, Check, Settings, Pencil, X, Wallet, Clock, ArrowDownToLine, AlertCircle, Palette, History, Globe,
} from "lucide-react";
import { TEMPLATE_GROUPS } from "@/lib/vendor-templates";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

interface VendorMe {
  id: string;
  phone: string;
  storeName: string | null;
  momoNumber: string;
  momoName: string;
  contactNumber: string;
  slug: string;
  subdomain?: string | null;
  status: string;
  template?: string;
  customDomain?: string | null;
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

interface SaleRecord {
  id: string;
  phone: string;
  examType: string;
  amount: string;
  quantity: number;
  createdAt: string | null;
}

interface WithdrawalRequestInfo {
  id: string;
  vendorId: string;
  amount: number;
  momoNumber: string;
  momoName: string;
  status: string;
  note: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

interface VendorPayouts {
  payouts: any[];
  pendingProfit: number;
  lastPayoutAt: string | null;
}

export default function VendorDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [savedField, setSavedField] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [subdomainInput, setSubdomainInput] = useState("");
  const [editingSubdomain, setEditingSubdomain] = useState(false);

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

  const { data: payoutData } = useQuery<VendorPayouts>({
    queryKey: ["/api/vendor/me/payouts"],
    enabled: !!vendor,
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery<WithdrawalRequestInfo[]>({
    queryKey: ["/api/vendor/me/withdrawals"],
    enabled: !!vendor,
  });

  const { data: salesHistory } = useQuery<SaleRecord[]>({
    queryKey: ["/api/vendor/me/sales"],
    enabled: !!vendor,
  });

  const requestWithdrawalMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vendor/withdrawal/request", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to submit request");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Withdrawal requested!", description: "Your request has been submitted. The admin will review and approve it." });
      refetchWithdrawals();
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me/payouts"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const pendingRequest = withdrawals?.find(w => w.status === "pending") ?? null;

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

  const [editingStoreName, setEditingStoreName] = useState(false);
  const [storeNameInput, setStoreNameInput] = useState("");
  const { toast } = useToast();

  const saveStoreNameMutation = useMutation({
    mutationFn: async (storeName: string) => {
      const res = await fetch("/api/vendor/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Store name updated", description: "Your store name has been saved." });
      setEditingStoreName(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await fetch("/api/vendor/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: templateId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save theme");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Theme saved!", description: "Your store page now uses the new theme." });
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveCustomDomainMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vendor/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDomain: customDomainInput.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Custom domain saved!", description: "Remember to set up URL forwarding on Namecheap." });
      setCustomDomainInput("");
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveSubdomainMutation = useMutation({
    mutationFn: async (subdomain: string) => {
      const res = await fetch("/api/vendor/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: subdomain.trim() || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save subdomain");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Subdomain saved!", description: "Your short URL is now live." });
      setEditingSubdomain(false);
      queryClient.invalidateQueries({ queryKey: ["/api/vendor/me"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
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

  const vendorPageUrl = `https://tekse.online/v/${vendor.slug}`;
  const legacyPageUrl = `https://allteksevoucher.store/v/${vendor.slug}`;
  const subdomainUrl = vendor.subdomain ? `https://tekse.online/${vendor.subdomain}` : null;

  const copyUrl = () => {
    navigator.clipboard.writeText(vendorPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const copyLegacyUrl = () => {
    navigator.clipboard.writeText(legacyPageUrl);
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
            {/* Legacy URL */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <div className="flex-1 bg-white/60 border border-purple-100/80 rounded-lg px-4 py-2 min-w-0">
                <p className="text-xs text-slate-500 truncate" data-testid="text-legacy-url">{legacyPageUrl}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-600 h-7 text-xs" onClick={copyLegacyUrl} data-testid="button-copy-legacy-url">
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            {/* Short Subdomain URL */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <div className="flex-1 bg-emerald-50/60 border border-emerald-200/80 rounded-lg px-4 py-2 min-w-0">
                {editingSubdomain ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">tekse.online/</span>
                    <Input
                      value={subdomainInput}
                      onChange={e => setSubdomainInput(e.target.value)}
                      className="h-6 text-xs w-40"
                      placeholder="yourname"
                      autoFocus
                      data-testid="input-subdomain"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 font-medium truncate" data-testid="text-subdomain-url">{subdomainUrl || "No short URL set yet"}</p>
                )}
              </div>
              {editingSubdomain ? (
                <>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveSubdomainMutation.mutate(subdomainInput)} disabled={saveSubdomainMutation.isPending} data-testid="button-save-subdomain">
                    {saveSubdomainMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingSubdomain(false)}>
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" className="text-slate-400 hover:text-emerald-600 h-7 text-xs" onClick={() => { setSubdomainInput(vendor.subdomain || ""); setEditingSubdomain(true); }} data-testid="button-edit-subdomain">
                  <Pencil className="w-3 h-3 mr-1" />
                  {vendor.subdomain ? "Change" : "Set Short URL"}
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">All links work — share whichever your customers know.</p>
          </CardContent>
        </Card>

        {/* Custom Domain */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base font-bold">Custom Domain</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Want your own domain? (e.g., <strong>brightshop.com</strong>) <br/>
                Set up URL forwarding on Namecheap to redirect to your store link above.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">URL</span>
                <Input
                  type="text"
                  placeholder="https://yourdomain.com"
                  value={customDomainInput}
                  onChange={(e) => setCustomDomainInput(e.target.value)}
                  className="pl-12 text-sm"
                  data-testid="input-custom-domain"
                />
              </div>
              <Button
                size="sm"
                onClick={() => saveCustomDomainMutation.mutate()}
                disabled={saveCustomDomainMutation.isPending}
                data-testid="button-save-custom-domain"
              >
                {saveCustomDomainMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
              </Button>
            </div>
            {vendor.customDomain && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Custom domain saved: {vendor.customDomain}
              </p>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Channel */}
        <Card className="border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-5 flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-green-800">Follow Our WhatsApp Channel</p>
              <p className="text-xs text-green-700 mt-0.5 mb-2">Get updates, announcements, and tips directly on WhatsApp.</p>
              <a
                href="https://whatsapp.com/channel/0029VbCUcjaJP20xcXlPOt2L"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-full transition-colors"
                data-testid="link-whatsapp-channel"
              >
                Follow Channel
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
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

        {/* Withdrawals */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-base font-bold">Earnings & Withdrawals</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pending profit + Request button */}
            <div className={`rounded-lg p-4 ${
              (payoutData?.pendingProfit ?? 0) > 0
                ? "bg-amber-50 border border-amber-200"
                : "bg-slate-50 border border-slate-100"
            }`}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Profit</p>
                  <p className={`text-3xl font-black mt-0.5 ${(payoutData?.pendingProfit ?? 0) > 0 ? "text-amber-700" : "text-slate-400"}`} data-testid="text-pending-profit">
                    GHC {payoutData?.pendingProfit ?? 0}
                  </p>
                  {payoutData?.lastPayoutAt && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Since last payout: {new Date(payoutData.lastPayoutAt).toLocaleDateString()}</p>
                  )}
                  {!payoutData?.lastPayoutAt && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Since your first sale</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {pendingRequest ? (
                    <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold px-3 py-2 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      Withdrawal Pending
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => requestWithdrawalMutation.mutate()}
                      disabled={requestWithdrawalMutation.isPending || (payoutData?.pendingProfit ?? 0) <= 0}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      data-testid="button-request-withdrawal"
                    >
                      {requestWithdrawalMutation.isPending
                        ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Requesting...</>
                        : <><ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" />Request Withdrawal</>}
                    </Button>
                  )}
                  {(payoutData?.pendingProfit ?? 0) <= 0 && !pendingRequest && (
                    <p className="text-[10px] text-slate-400">No profit to withdraw yet</p>
                  )}
                </div>
              </div>
              {pendingRequest && (
                <div className="mt-3 pt-3 border-t border-amber-100 text-[11px] text-amber-700">
                  <span className="font-semibold">GHC {pendingRequest.amount}</span> withdrawal request submitted on {new Date(pendingRequest.createdAt).toLocaleDateString()} — waiting for admin approval. Payment will be sent to MoMo: <span className="font-semibold">{pendingRequest.momoNumber}</span> ({pendingRequest.momoName}).
                </div>
              )}
            </div>

            {/* Withdrawal history */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Withdrawal History</p>
              {!withdrawals || withdrawals.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-slate-400">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">No withdrawal requests yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <div key={w.id} className="flex items-center justify-between py-2.5 gap-2" data-testid={`withdrawal-row-${w.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">GHC {w.amount}</span>
                          <Badge
                            variant={w.status === "approved" ? "default" : w.status === "pending" ? "secondary" : "destructive"}
                            className="text-[10px]"
                          >
                            {w.status === "approved" ? "Approved" : w.status === "pending" ? "Pending" : "Rejected"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Requested {new Date(w.createdAt).toLocaleDateString()}
                          {w.resolvedAt && ` · Resolved ${new Date(w.resolvedAt).toLocaleDateString()}`}
                        </p>
                        {w.status === "rejected" && w.note && (
                          <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{w.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
            {/* Store Name — editable */}
            <div className="flex items-center justify-between gap-2 py-1 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-500">Store Name</span>
              {editingStoreName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={storeNameInput}
                    onChange={e => setStoreNameInput(e.target.value)}
                    className="h-7 text-sm w-44"
                    placeholder="Enter store name"
                    autoFocus
                    data-testid="input-store-name"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => saveStoreNameMutation.mutate(storeNameInput)}
                    disabled={saveStoreNameMutation.isPending}
                    data-testid="button-save-store-name"
                  >
                    {saveStoreNameMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStoreName(false)}>
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800" data-testid="text-account-store-name">
                    {vendor.storeName || vendor.momoName}
                  </span>
                  <button
                    onClick={() => { setStoreNameInput(vendor.storeName || ""); setEditingStoreName(true); }}
                    className="text-slate-400 hover:text-purple-600 transition-colors"
                    data-testid="button-edit-store-name"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {[
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

        {/* Sales History */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <CardTitle className="text-base font-bold">Sales History</CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Last 100 completed purchases through your store link.</p>
          </CardHeader>
          <CardContent>
            {!salesHistory || salesHistory.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No sales yet. Share your store link to start selling!</p>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-400 pb-2 px-2">Buyer Phone</th>
                      <th className="text-left text-xs font-semibold text-slate-400 pb-2 px-2">Card Type</th>
                      <th className="text-center text-xs font-semibold text-slate-400 pb-2 px-2">Qty</th>
                      <th className="text-right text-xs font-semibold text-slate-400 pb-2 px-2">Amount</th>
                      <th className="text-right text-xs font-semibold text-slate-400 pb-2 px-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesHistory.map((sale) => {
                      const raw = sale.phone.replace(/\D/g, "");
                      const masked = raw.length >= 7
                        ? raw.slice(0, 3) + "****" + raw.slice(-4)
                        : sale.phone;
                      const date = sale.createdAt
                        ? new Date(sale.createdAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })
                        : "—";
                      return (
                        <tr key={sale.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                          <td className="py-2 px-2 font-mono text-slate-700">{masked}</td>
                          <td className="py-2 px-2 text-slate-600">{sale.examType}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{sale.quantity ?? 1}</td>
                          <td className="py-2 px-2 text-right font-semibold text-emerald-600">GHC {Number(sale.amount).toFixed(2)}</td>
                          <td className="py-2 px-2 text-right text-slate-400 text-xs">{date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Page Theme Picker */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              <CardTitle className="text-base font-bold">Page Theme</CardTitle>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Customise the look of your public store page. Click a theme to apply instantly.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {TEMPLATE_GROUPS.map((group) => {
              const activeId = vendor.template ?? "classic-purple";
              return (
                <div key={group.layout}>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.templates.map((t) => {
                      const isActive = t.id === activeId;
                      const isSaving = saveTemplateMutation.isPending && saveTemplateMutation.variables === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => !isActive && saveTemplateMutation.mutate(t.id)}
                          disabled={saveTemplateMutation.isPending}
                          title={t.name}
                          data-testid={`theme-swatch-${t.id}`}
                          style={{ outline: isActive ? `2.5px solid #7c3aed` : "none", outlineOffset: 2 }}
                          className={`relative flex flex-col items-center gap-1 rounded-lg overflow-hidden border transition-all duration-150 ${
                            isActive ? "border-purple-400 shadow-md" : "border-transparent hover:border-slate-300"
                          } ${saveTemplateMutation.isPending && !isSaving ? "opacity-50" : ""}`}
                        >
                          <div
                            style={{ background: t.swatchGradient, width: 72, height: 44, borderRadius: "6px 6px 0 0", position: "relative" }}
                          >
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-t-md">
                                <Check className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                            {isSaving && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-md">
                                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-semibold text-slate-500 pb-1 leading-none max-w-[72px] truncate px-0.5">
                            {t.name.split(" ").slice(1).join(" ")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
