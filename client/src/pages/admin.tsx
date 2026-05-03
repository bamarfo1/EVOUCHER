import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, CreditCard, TrendingUp, LogOut, Plus, Image, Trash2,
  ChevronDown, ChevronUp, Package, Users, Wallet, RefreshCw, Check, X, Pencil
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CardSummary {
  examType: string; total: number; used: number; available: number; price: number; imageUrl: string | null;
}
interface SalesByType { examType: string; count: number; revenue: number; }
interface SalesSummary { totalSales: number; totalRevenue: number; byType: SalesByType[]; }
interface AdminSummary { sales: SalesSummary; cards: CardSummary[]; }
interface Transaction { id: string; phone: string; email: string | null; examType: string; amount: number; status: string; createdAt: string; paystackReference: string; }

interface VendorRow {
  vendor: {
    id: string; phone: string; storeName: string | null; momoName: string; momoNumber: string;
    contactNumber: string; slug: string; status: string; createdAt: string;
  };
  totalSales: number;
  totalRevenue: number;
  pendingProfit: number;
  lastPayoutAt: string | null;
}

interface Payout { id: string; vendorId: string; amount: number; notes: string | null; createdAt: string; }

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) { onLogin(); }
      else { setError("Invalid email or password"); }
    } catch { setError("Connection error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-xl">Admin Panel</CardTitle>
          <p className="text-sm text-slate-500">AllTekSE e-Voucher</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" required data-testid="input-admin-email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required data-testid="input-admin-password" />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Add Vouchers Form ────────────────────────────────────────────────────────
function AddVouchersForm({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [examType, setExamType] = useState("");
  const [price, setPrice] = useState("20");
  const [bulkText, setBulkText] = useState("");
  const [open, setOpen] = useState(false);

  const addMutation = useMutation({
    mutationFn: async (vouchers: { serial: string; pin: string; examType: string; price: number }[]) =>
      apiRequest("POST", "/api/admin/vouchers", { vouchers }),
    onSuccess: (data: any) => {
      toast({ title: "Vouchers added", description: `${data.added} voucher(s) added successfully.` });
      setBulkText(""); setExamType(""); setPrice("20");
      onAdded();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const vouchers = lines.map(line => {
      const [serial, pin] = line.split(",").map(s => s.trim());
      return { serial, pin, examType: examType.trim(), price: parseInt(price) || 20 };
    }).filter(v => v.serial && v.pin && v.examType);
    if (vouchers.length === 0) {
      toast({ title: "No valid vouchers", description: "Check format: SERIAL, PIN (one per line)", variant: "destructive" });
      return;
    }
    addMutation.mutate(vouchers);
  };

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">Add Voucher Cards</CardTitle>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Card Type</Label>
                <Input value={examType} onChange={e => setExamType(e.target.value)} placeholder="e.g. BECE, WASSCE" required data-testid="input-exam-type" />
              </div>
              <div>
                <Label>Price (GHC)</Label>
                <Input type="number" value={price} onChange={e => setPrice(e.target.value)} min="1" required data-testid="input-price" />
              </div>
            </div>
            <div>
              <Label>Vouchers (SERIAL, PIN — one per line)</Label>
              <textarea
                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm font-mono resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder={"SERIAL001, PIN-1234-5678\nSERIAL002, PIN-9876-5432"}
                data-testid="input-bulk-vouchers"
              />
            </div>
            <Button type="submit" disabled={addMutation.isPending} className="w-full" data-testid="button-add-vouchers">
              {addMutation.isPending ? "Adding..." : "Add Vouchers"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Update Image Form ─────────────────────────────────────────────────────────
function UpdateImageForm({ examTypes, onUpdated }: { examTypes: string[]; onUpdated: () => void }) {
  const { toast } = useToast();
  const [examType, setExamType] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data: { examType: string; imageUrl: string }) =>
      apiRequest("PUT", "/api/admin/card-image", data),
    onSuccess: () => {
      toast({ title: "Image updated", description: `Image set for ${examType}` });
      setExamType(""); setImageUrl("");
      onUpdated();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-blue-600" />
            <CardTitle className="text-base">Update Card Image</CardTitle>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate({ examType, imageUrl }); }} className="space-y-3">
            <div>
              <Label>Card Type</Label>
              <select className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={examType} onChange={e => setExamType(e.target.value)} required data-testid="select-exam-type-image">
                <option value="">Select card type...</option>
                {examTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" required data-testid="input-image-url" />
            </div>
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-full h-24 object-cover rounded-md border" onError={e => (e.currentTarget.style.display = "none")} />
            )}
            <Button type="submit" disabled={updateMutation.isPending} className="w-full" data-testid="button-update-image">
              {updateMutation.isPending ? "Updating..." : "Update Image"}
            </Button>
          </form>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Vendor Payout Card ────────────────────────────────────────────────────────
function VendorPayoutCard({ row, onRefresh }: { row: VendorRow; onRefresh: () => void }) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(String(row.pendingProfit));
  const [payoutNotes, setPayoutNotes] = useState("");
  const [editStoreName, setEditStoreName] = useState(false);
  const [storeNameVal, setStoreNameVal] = useState(row.vendor.storeName || "");

  const { data: payoutHistory, refetch: refetchHistory } = useQuery<Payout[]>({
    queryKey: ["/api/admin/vendors", row.vendor.id, "payouts"],
    queryFn: async () => {
      const res = await fetch(`/api/admin/vendors/${row.vendor.id}/payouts`);
      return res.json();
    },
    enabled: expanded,
  });

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/vendors/${row.vendor.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payoutAmount), notes: payoutNotes }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout recorded", description: `GHC ${payoutAmount} marked as paid to ${row.vendor.storeName || row.vendor.momoName}. Account reopened.` });
      setPayoutAmount("0");
      setPayoutNotes("");
      refetchHistory();
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (data: { storeName?: string; status?: string }) => {
      const res = await fetch(`/api/admin/vendors/${row.vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Vendor info updated." });
      setEditStoreName(false);
      onRefresh();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusColor = row.vendor.status === "active" ? "default" : "destructive";

  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {editStoreName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={storeNameVal}
                    onChange={e => setStoreNameVal(e.target.value)}
                    className="h-7 text-sm w-40"
                    placeholder="Store name"
                    data-testid={`input-store-name-${row.vendor.id}`}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateVendorMutation.mutate({ storeName: storeNameVal })} disabled={updateVendorMutation.isPending}>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditStoreName(false)}>
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-800">{row.vendor.storeName || row.vendor.momoName}</p>
                  <button onClick={() => { setStoreNameVal(row.vendor.storeName || ""); setEditStoreName(true); }} className="text-slate-400 hover:text-slate-600" data-testid={`button-edit-store-name-${row.vendor.id}`}>
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
              <Badge variant={statusColor} className="text-[10px]" data-testid={`badge-vendor-status-${row.vendor.id}`}>
                {row.vendor.status === "active" ? "Active" : "Closed for Payout"}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">{row.vendor.phone} · MoMo: {row.vendor.momoNumber} ({row.vendor.momoName})</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {row.vendor.status === "closed_for_payout" ? (
              <Button size="sm" variant="outline" onClick={() => updateVendorMutation.mutate({ status: "active" })} disabled={updateVendorMutation.isPending} data-testid={`button-reopen-vendor-${row.vendor.id}`}>
                Reopen
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => updateVendorMutation.mutate({ status: "closed_for_payout" })} disabled={updateVendorMutation.isPending} data-testid={`button-close-vendor-${row.vendor.id}`}>
                Close for Payout
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)} data-testid={`button-expand-vendor-${row.vendor.id}`}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500 font-medium">Sales</p>
            <p className="text-base font-black text-slate-800" data-testid={`text-vendor-sales-${row.vendor.id}`}>{row.totalSales}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-slate-500 font-medium">Revenue</p>
            <p className="text-base font-black text-slate-800">GHC {row.totalRevenue}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2.5 text-center border border-amber-100">
            <p className="text-[10px] text-amber-600 font-medium">Profit Due</p>
            <p className="text-base font-black text-amber-700" data-testid={`text-vendor-profit-${row.vendor.id}`}>GHC {row.pendingProfit}</p>
          </div>
        </div>

        {/* Expanded: payout form + history */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
            {/* Mark as paid */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mark Payout as Paid</p>
              <p className="text-xs text-slate-500">Pay vendor via MoMo externally, then record it here to reopen their account.</p>
              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[120px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">GHC</span>
                  <Input
                    type="number"
                    min="0"
                    value={payoutAmount}
                    onChange={e => setPayoutAmount(e.target.value)}
                    className="pl-10 text-sm"
                    data-testid={`input-payout-amount-${row.vendor.id}`}
                  />
                </div>
                <Input
                  placeholder="Notes (optional)"
                  value={payoutNotes}
                  onChange={e => setPayoutNotes(e.target.value)}
                  className="flex-1 min-w-[140px] text-sm"
                  data-testid={`input-payout-notes-${row.vendor.id}`}
                />
                <Button
                  size="sm"
                  onClick={() => payoutMutation.mutate()}
                  disabled={payoutMutation.isPending || !payoutAmount || Number(payoutAmount) <= 0}
                  data-testid={`button-mark-paid-${row.vendor.id}`}
                >
                  {payoutMutation.isPending ? "Saving..." : "Mark as Paid"}
                </Button>
              </div>
              {row.lastPayoutAt && (
                <p className="text-[11px] text-slate-400">Last payout: {new Date(row.lastPayoutAt).toLocaleDateString()}</p>
              )}
            </div>

            {/* Payout history */}
            {payoutHistory && payoutHistory.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payout History</p>
                <div className="divide-y divide-slate-50">
                  {payoutHistory.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-1.5" data-testid={`payout-row-${p.id}`}>
                      <div>
                        <span className="text-xs font-semibold text-slate-700">GHC {p.amount}</span>
                        {p.notes && <span className="text-xs text-slate-400 ml-2">· {p.notes}</span>}
                      </div>
                      <span className="text-[11px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Card Type Row ─────────────────────────────────────────────────────────────
function CardTypeRow({ card, onDeleted }: { card: CardSummary; onDeleted: () => void }) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/card-types/${encodeURIComponent(card.examType)}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to delete");
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Card type deleted", description: `Removed ${data.deleted} unused ${card.examType} voucher${data.deleted !== 1 ? "s" : ""}.` });
      setConfirming(false);
      onDeleted();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="flex items-center gap-3 px-4 py-3" data-testid={`card-row-${card.examType}`}>
      <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.examType} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-teal-400">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{card.examType}</p>
        <p className="text-xs text-slate-500">GHC {card.price} · {card.total} total</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">{card.available} left</Badge>
        <Badge variant={card.used > 0 ? "default" : "outline"} className="text-xs">{card.used} sold</Badge>
        {card.available === 0 && (
          confirming ? (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid={`button-confirm-delete-${card.examType}`}>
                {deleteMutation.isPending ? "Deleting..." : "Confirm"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} data-testid={`button-cancel-delete-${card.examType}`}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="icon" variant="ghost" onClick={() => setConfirming(true)} className="text-red-400 hover-elevate" data-testid={`button-delete-${card.examType}`}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

// ─── Vendors Tab ──────────────────────────────────────────────────────────────
function VendorsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: vendors, isLoading, refetch } = useQuery<VendorRow[]>({
    queryKey: ["/api/admin/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors");
      if (!res.ok) throw new Error("Failed to load vendors");
      return res.json();
    },
  });

  const closeAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/close-vendors-for-payout", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Done", description: "All active vendor accounts closed for payout." });
      refetch();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const activeCount = vendors?.filter(v => v.vendor.status === "active").length ?? 0;
  const closedCount = vendors?.filter(v => v.vendor.status === "closed_for_payout").length ?? 0;
  const totalProfit = vendors?.reduce((s, v) => s + v.pendingProfit, 0) ?? 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Total Vendors</p>
            <p className="text-2xl font-bold text-slate-900" data-testid="stat-total-vendors">{vendors?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Active / Closed</p>
            <p className="text-2xl font-bold text-slate-900">{activeCount} / {closedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-amber-600 mb-1 font-medium">Total Profit Due</p>
            <p className="text-2xl font-bold text-amber-700" data-testid="stat-total-profit-due">GHC {totalProfit}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-50"
          onClick={() => closeAllMutation.mutate()}
          disabled={closeAllMutation.isPending || activeCount === 0}
          data-testid="button-close-all-vendors"
        >
          <Wallet className="w-3.5 h-3.5 mr-1.5" />
          {closeAllMutation.isPending ? "Closing..." : "Close All for Payout"}
        </Button>
      </div>

      {/* Vendor list */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading vendors...</div>
      ) : !vendors || vendors.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-400 text-sm">No vendors registered yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vendors.map(row => (
            <VendorPayoutCard key={row.vendor.id} row={row} onRefresh={() => { refetch(); qc.invalidateQueries({ queryKey: ["/api/admin/vendors"] }); }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "vendors">("overview");

  const { data: authData } = useQuery<{ loggedIn: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const { data: summary, refetch: refetchSummary } = useQuery<AdminSummary>({
    queryKey: ["/api/admin/summary"],
    enabled: !!authData?.loggedIn,
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: !!authData?.loggedIn,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/logout", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/check"] }),
  });

  if (!authData?.loggedIn) {
    return <LoginPage onLogin={() => qc.invalidateQueries({ queryKey: ["/api/admin/check"] })} />;
  }

  const { sales, cards } = summary || { sales: { totalSales: 0, totalRevenue: 0, byType: [] }, cards: [] };
  const examTypes = cards.map(c => c.examType);

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["/api/admin/summary"] });
    qc.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-500 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg">Admin Panel</h1>
            <p className="text-white/70 text-xs">AllTekSE e-Voucher</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="text-white border-white/40 bg-white/10" onClick={() => window.location.href = "/"} data-testid="button-view-site">
              View Site
            </Button>
            <Button size="sm" variant="outline" className="text-white border-white/40 bg-white/10" onClick={() => logoutMutation.mutate()} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {[
            { key: "overview", label: "Overview", icon: ShoppingBag },
            { key: "vendors", label: "Vendors", icon: Users },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === key
                  ? "border-purple-600 text-purple-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
              data-testid={`tab-${key}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {activeTab === "overview" ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card data-testid="stat-total-sales">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-slate-500">Total Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{sales.totalSales}</p>
                </CardContent>
              </Card>
              <Card data-testid="stat-total-revenue">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    <span className="text-xs text-slate-500">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">GHC {sales.totalRevenue}</p>
                </CardContent>
              </Card>
            </div>

            {/* Card Inventory */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-base">Card Inventory</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {cards.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">No cards in database</p>
                  )}
                  {cards.map(card => (
                    <CardTypeRow key={card.examType} card={card} onDeleted={handleRefresh} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales by Type */}
            {sales.byType.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <CardTitle className="text-base">Sales by Card Type</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {sales.byType.map(item => (
                      <div key={item.examType} className="flex items-center justify-between px-4 py-3" data-testid={`sales-row-${item.examType}`}>
                        <span className="text-sm text-slate-700">{item.examType}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">{item.count} sold</span>
                          <span className="text-sm font-semibold text-teal-700">GHC {item.revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Vouchers */}
            <AddVouchersForm onAdded={handleRefresh} />

            {/* Update Image */}
            <UpdateImageForm examTypes={examTypes} onUpdated={handleRefresh} />

            {/* Recent Transactions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {!transactions || transactions.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No transactions yet</p>
                ) : (
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {transactions.map(tx => (
                      <div key={tx.id} className="px-4 py-3" data-testid={`txn-row-${tx.id}`}>
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium text-slate-800 truncate">{tx.phone}</span>
                          <Badge variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"} className="text-[10px] flex-shrink-0">
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">{tx.examType} · GHC {tx.amount}</span>
                          <span className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <VendorsTab />
        )}
      </div>
    </div>
  );
}
