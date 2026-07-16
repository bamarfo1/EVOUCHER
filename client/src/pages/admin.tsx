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
  ChevronDown, ChevronUp, Package, Users, Wallet, RefreshCw, Check, X, Pencil,
  ArrowDownToLine, Clock, CheckCircle, XCircle, Send
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CardSummary {
  examType: string; total: number; used: number; available: number; price: number; imageUrl: string | null;
}
interface SalesByType { examType: string; count: number; revenue: number; }
interface SalesSummary { totalSales: number; totalRevenue: number; byType: SalesByType[]; }
interface AdminSummary { sales: SalesSummary; cards: CardSummary[]; }
interface Transaction { id: string; phone: string; email: string | null; examType: string; amount: number; status: string; createdAt: string; paystackReference: string; }

interface VendorPrice { id: string; vendorId: string; examType: string; price: number; }

interface VendorRow {
  vendor: {
    id: string; phone: string; storeName: string | null; momoName: string; momoNumber: string;
    contactNumber: string; slug: string; status: string; createdAt: string;
  };
  prices: VendorPrice[];
  totalSales: number;
  totalRevenue: number;
  pendingProfit: number;
  lastPayoutAt: string | null;
}

interface Payout { id: string; vendorId: string; amount: number; notes: string | null; status: string; paidAt: string | null; createdAt: string; }
interface WithdrawalRequestRow {
  id: string; vendorId: string; amount: number; momoNumber: string; momoName: string;
  status: string; note: string | null; createdAt: string; resolvedAt: string | null;
  vendor: { id: string; phone: string; storeName: string | null; momoName: string; momoNumber: string; slug: string; };
}

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

// ─── Manage Card Types Form ────────────────────────────────────────────────────
function RegistryRow({ r, onSaved, onDeleted }: { r: { examType: string; price: number }; onSaved: () => void; onDeleted: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(String(r.price));

  const priceMutation = useMutation({
    mutationFn: async () => {
      const p = parseFloat(editPrice);
      if (isNaN(p) || p < 1) throw new Error("Price must be at least GHC 1");
      await apiRequest("PATCH", `/api/admin/card-type-registry/${encodeURIComponent(r.examType)}`, { price: p });
    },
    onSuccess: () => {
      toast({ title: "Price updated", description: `${r.examType} is now GHC ${editPrice} on the website.` });
      setEditing(false);
      onSaved();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/card-type-registry/${encodeURIComponent(r.examType)}`);
    },
    onSuccess: () => {
      toast({ title: "Card type removed" });
      onDeleted();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-sm font-semibold text-slate-800 flex-1">{r.examType}</span>
      {editing ? (
        <>
          <Input
            type="number"
            min="1"
            value={editPrice}
            onChange={e => setEditPrice(e.target.value)}
            className="w-24 h-7 text-sm"
            autoFocus
            data-testid={`input-price-${r.examType}`}
          />
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => priceMutation.mutate()}
            disabled={priceMutation.isPending}
            data-testid={`button-save-price-${r.examType}`}
          >
            {priceMutation.isPending ? "..." : "Save"}
          </Button>
          <Button
            size="sm" variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => { setEditing(false); setEditPrice(String(r.price)); }}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <span className="text-xs text-slate-500">GHC {r.price}</span>
          <Button
            size="icon" variant="ghost"
            className="h-7 w-7 text-blue-500"
            title="Edit price"
            onClick={() => { setEditPrice(String(r.price)); setEditing(true); }}
            data-testid={`button-edit-price-${r.examType}`}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon" variant="ghost"
            className="h-7 w-7 text-red-400"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-registry-${r.examType}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

function ManageCardTypesForm({ onUpdated }: { onUpdated: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("20");

  const { data: registry = [], refetch } = useQuery<{ examType: string; price: number }[]>({
    queryKey: ["/api/admin/card-type-registry"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/card-type-registry");
      return res.json();
    },
    enabled: open,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/card-type-registry", {
        examType: newName.trim().toUpperCase(),
        price: parseFloat(newPrice),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Card type added", description: `${newName.trim().toUpperCase()} registered at GHC ${newPrice}.` });
      setNewName(""); setNewPrice("20");
      refetch();
      qc.invalidateQueries({ queryKey: ["/api/admin/card-type-registry"] });
      onUpdated();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const invalidate = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["/api/admin/card-type-registry"] });
    onUpdated();
  };

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">Manage Card Types</CardTitle>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          {/* Add new card type */}
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Card Type Name</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. BECE, WASSCE"
                data-testid="input-registry-name"
              />
            </div>
            <div className="w-28">
              <Label>Price (GHC)</Label>
              <Input
                type="number"
                min="1"
                value={newPrice}
                onChange={e => setNewPrice(e.target.value)}
                data-testid="input-registry-price"
              />
            </div>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending || !newName.trim()}
              className="shrink-0"
              data-testid="button-add-registry"
            >
              {addMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>

          {/* Existing card types */}
          {registry.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3">No card types registered yet</p>
          ) : (
            <div className="divide-y border rounded-md">
              {registry.map(r => (
                <RegistryRow key={r.examType} r={r} onSaved={invalidate} onDeleted={invalidate} />
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">
            The price set here is the <strong>website price</strong> customers see and pay. Click the <Pencil className="inline w-3 h-3" /> icon to edit.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function AddVouchersForm({ onAdded }: { onAdded: () => void }) {
  const { toast } = useToast();
  const [examType, setExamType] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [open, setOpen] = useState(false);

  const { data: registry = [] } = useQuery<{ examType: string; price: number }[]>({
    queryKey: ["/api/admin/card-type-registry"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/card-type-registry");
      return res.json();
    },
  });

  const selectedPrice = registry.find(r => r.examType === examType)?.price ?? 20;

  const addMutation = useMutation({
    mutationFn: async (vouchers: { serial: string; pin: string; examType: string; price: number }[]) =>
      apiRequest("POST", "/api/admin/vouchers", { vouchers }),
    onSuccess: (data: any) => {
      toast({ title: "Vouchers added", description: `${data.added} voucher(s) added successfully.` });
      setBulkText(""); setExamType("");
      onAdded();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examType) {
      toast({ title: "Select a card type", variant: "destructive" });
      return;
    }
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const vouchers = lines.map(line => {
      const [serial, pin] = line.split(",").map(s => s.trim());
      return { serial, pin, examType, price: selectedPrice };
    }).filter(v => v.serial && v.pin);
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
            <div>
              <Label>Card Type</Label>
              {registry.length === 0 ? (
                <p className="text-xs text-amber-600 mt-1 p-2 bg-amber-50 rounded-md">
                  No card types registered yet. Add card types using "Manage Card Types" above first.
                </p>
              ) : (
                <select
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={examType}
                  onChange={e => setExamType(e.target.value)}
                  required
                  data-testid="select-exam-type"
                >
                  <option value="">Select card type...</option>
                  {registry.map(r => (
                    <option key={r.examType} value={r.examType}>
                      {r.examType} — GHC {r.price}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {examType && (
              <p className="text-xs text-slate-500">
                Price: <span className="font-semibold text-purple-700">GHC {selectedPrice}</span> per voucher (from registry)
              </p>
            )}
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
            <Button type="submit" disabled={addMutation.isPending || !examType} className="w-full" data-testid="button-add-vouchers">
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

  const markPaidMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const res = await fetch(`/api/admin/payouts/${payoutId}/mark-paid`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Payout marked as paid" });
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

  const unpaidPayouts = payoutHistory?.filter(p => p.status === "unpaid") ?? [];

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
              <Badge variant="default" className="text-[10px]" data-testid={`badge-vendor-status-${row.vendor.id}`}>Active</Badge>
            </div>
            <p className="text-xs text-slate-500">{row.vendor.phone} · MoMo: {row.vendor.momoNumber} ({row.vendor.momoName})</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(e => !e)} data-testid={`button-expand-vendor-${row.vendor.id}`}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
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

        {/* Expanded: details + payout history */}
        {expanded && (
          <div className="mt-4 border-t border-slate-100 pt-4 space-y-4">
            {/* Store URL */}
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Store Link</p>
              <a
                href={`/v/${row.vendor.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline break-all"
                data-testid={`link-vendor-store-${row.vendor.id}`}
              >
                {`${window.location.origin}/v/${row.vendor.slug}`}
              </a>
            </div>

            {/* Current pricing */}
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Custom Pricing</p>
              {!row.prices || row.prices.length === 0 ? (
                <p className="text-xs text-slate-400">Using base prices (no overrides set)</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {row.prices.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-1 rounded-md" data-testid={`price-${row.vendor.id}-${p.examType}`}>
                      <span className="font-bold">{p.examType}</span>
                      <span className="text-slate-500">GHC {p.price % 1 === 0 ? p.price : p.price.toFixed(2)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Payout History</p>
              {!payoutHistory || payoutHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No payouts recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {payoutHistory.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 gap-2" data-testid={`payout-row-${p.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-800">GHC {p.amount}</span>
                          <Badge
                            variant={p.status === "paid" ? "default" : "destructive"}
                            className="text-[10px]"
                            data-testid={`badge-payout-status-${p.id}`}
                          >
                            {p.status === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {p.status === "paid" && p.paidAt
                            ? `Paid on ${new Date(p.paidAt).toLocaleDateString()}`
                            : `Closed on ${new Date(p.createdAt).toLocaleDateString()}`}
                          {p.notes && ` · ${p.notes}`}
                        </p>
                      </div>
                      {p.status === "unpaid" && (
                        <Button
                          size="sm"
                          onClick={() => markPaidMutation.mutate(p.id)}
                          disabled={markPaidMutation.isPending}
                          data-testid={`button-mark-paid-${p.id}`}
                        >
                          {markPaidMutation.isPending ? "..." : "Mark as Paid"}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {unpaidPayouts.length > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  {unpaidPayouts.length} unpaid payout{unpaidPayouts.length > 1 ? "s" : ""} · Total: GHC {unpaidPayouts.reduce((s, p) => s + p.amount, 0)}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Vendor Base Prices Form ──────────────────────────────────────────────────
function VendorBasePricesForm({ cards, onUpdated }: { cards: CardSummary[]; onUpdated: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [savedField, setSavedField] = useState<string | null>(null);

  const { data: vendorBasePrices, refetch } = useQuery<{ examType: string; price: number }[]>({
    queryKey: ["/api/admin/vendor-base-prices"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendor-base-prices");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ examType, price }: { examType: string; price: number }) => {
      const res = await fetch("/api/admin/vendor-base-price", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examType, price }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return { examType };
    },
    onSuccess: ({ examType }) => {
      setSavedField(examType);
      setTimeout(() => setSavedField(null), 2000);
      refetch();
      onUpdated();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const basePriceMap = Object.fromEntries((vendorBasePrices || []).map(p => [p.examType, p.price]));

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-base">Vendor Base Prices</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Set prices given to vendors (separate from website price)</span>
            {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {cards.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No card types in inventory.</p>
          ) : (
            cards.map((card) => {
              const currentVendorBase = basePriceMap[card.examType];
              const inputVal = editingPrices[card.examType] ?? String(currentVendorBase ?? card.price);
              const inputNum = parseFloat(inputVal) || 0;
              return (
                <div key={card.examType} className="flex items-center gap-3 flex-wrap border border-slate-100 rounded-lg p-3 bg-slate-50" data-testid={`vendor-base-price-row-${card.examType}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">{card.examType}</p>
                    <div className="flex flex-wrap gap-3 mt-0.5">
                      <span className="text-[11px] text-slate-500">Website price: <strong className="text-slate-700">GHC {card.price}</strong></span>
                      {currentVendorBase !== undefined && (
                        <span className="text-[11px] text-amber-600 font-semibold">Current vendor base: GHC {currentVendorBase}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">GHC</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={inputVal}
                        onChange={(e) => setEditingPrices(p => ({ ...p, [card.examType]: e.target.value }))}
                        className="pl-12 w-28 font-bold"
                        data-testid={`input-vendor-base-price-${card.examType}`}
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => saveMutation.mutate({ examType: card.examType, price: inputNum })}
                      disabled={saveMutation.isPending}
                      data-testid={`button-save-vendor-base-price-${card.examType}`}
                    >
                      {savedField === card.examType ? (
                        <span className="flex items-center gap-1.5 text-emerald-600"><Check className="w-3.5 h-3.5" />Saved</span>
                      ) : saveMutation.isPending ? "..." : "Save"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
          <p className="text-xs text-slate-400 mt-1">Vendors must set their selling price ≥ vendor base price. Their profit = (selling price − vendor base price) × quantity.</p>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Card Type Row ─────────────────────────────────────────────────────────────
function CardTypeRow({ card, onDeleted }: { card: CardSummary; onDeleted: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInput, setPriceInput] = useState(String(card.price));

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

  const priceMutation = useMutation({
    mutationFn: async (price: number) => {
      const res = await fetch(`/api/admin/card-types/${encodeURIComponent(card.examType)}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to update price");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Price updated", description: `${card.examType} is now GHC ${priceInput}.` });
      setEditingPrice(false);
      qc.invalidateQueries({ queryKey: ["/api/admin/summary"] });
      qc.invalidateQueries({ queryKey: ["/api/card-types"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const savePrice = () => {
    const val = parseInt(priceInput, 10);
    if (!val || val < 1) return toast({ title: "Invalid price", description: "Price must be at least GHC 1.", variant: "destructive" });
    priceMutation.mutate(val);
  };

  return (
    <div className="px-4 py-3 space-y-2" data-testid={`card-row-${card.examType}`}>
      <div className="flex items-center gap-3">
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
          <p className="text-xs text-slate-500">{card.total} total · {card.available} left · {card.used} sold</p>
        </div>
        {card.available === 0 && (
          <div className="flex items-center gap-1">
            {confirming ? (
              <>
                <span className="text-xs text-red-500 mr-1">Delete card type?</span>
                <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} data-testid={`button-confirm-delete-${card.examType}`}>
                  {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} data-testid={`button-cancel-delete-${card.examType}`}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="icon" variant="ghost" onClick={() => setConfirming(true)} className="text-red-400" data-testid={`button-delete-${card.examType}`}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Price editor */}
      <div className="flex items-center gap-2 pl-13">
        {editingPrice ? (
          <div className="flex items-center gap-2 ml-13">
            <span className="text-xs text-slate-500">GHC</span>
            <Input
              type="number"
              min={1}
              value={priceInput}
              onChange={e => setPriceInput(e.target.value)}
              className="h-7 w-24 text-sm"
              data-testid={`input-price-${card.examType}`}
              onKeyDown={e => { if (e.key === "Enter") savePrice(); if (e.key === "Escape") setEditingPrice(false); }}
              autoFocus
            />
            <Button size="icon" variant="ghost" className="h-7 w-7 text-teal-600" onClick={savePrice} disabled={priceMutation.isPending} data-testid={`button-save-price-${card.examType}`}>
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => { setEditingPrice(false); setPriceInput(String(card.price)); }} data-testid={`button-cancel-price-${card.examType}`}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-purple-600 transition-colors group"
            onClick={() => setEditingPrice(true)}
            data-testid={`button-edit-price-${card.examType}`}
          >
            <span className="font-semibold">GHC {card.price}</span>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-slate-400 text-xs">(website price)</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Vendors Tab ──────────────────────────────────────────────────────────────
function VendorsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: vendors, isLoading: vendorsLoading, refetch: refetchVendors } = useQuery<VendorRow[]>({
    queryKey: ["/api/admin/vendors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vendors");
      if (!res.ok) throw new Error("Failed to load vendors");
      return res.json();
    },
  });

  const { data: withdrawalRequests, isLoading: wrLoading, refetch: refetchWR } = useQuery<WithdrawalRequestRow[]>({
    queryKey: ["/api/admin/withdrawal-requests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/withdrawal-requests");
      if (!res.ok) throw new Error("Failed to load withdrawal requests");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/withdrawal-requests/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Withdrawal approved", description: "Payment has been recorded and profit reset." });
      refetchWR();
      refetchVendors();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const res = await fetch(`/api/admin/withdrawal-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Withdrawal rejected" });
      refetchWR();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalProfit = vendors?.reduce((s, v) => s + v.pendingProfit, 0) ?? 0;
  const pendingRequests = withdrawalRequests?.filter(r => r.status === "pending") ?? [];
  const recentResolved = withdrawalRequests?.filter(r => r.status !== "pending").slice(0, 10) ?? [];

  const refresh = () => { refetchVendors(); refetchWR(); qc.invalidateQueries({ queryKey: ["/api/admin/vendors"] }); };

  return (
    <div className="space-y-5">
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
            <p className="text-xs text-amber-600 mb-1 font-medium">Pending Requests</p>
            <p className="text-2xl font-bold text-amber-700">{pendingRequests.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Total Profit Due</p>
            <p className="text-2xl font-bold text-slate-900" data-testid="stat-total-profit-due">GHC {totalProfit}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={refresh}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Pending Withdrawal Requests */}
      <Card className="border-amber-200">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-base">Withdrawal Requests</CardTitle>
            {pendingRequests.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 text-[10px]">{pendingRequests.length} pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {wrLoading ? (
            <p className="text-sm text-slate-400 text-center py-6">Loading...</p>
          ) : pendingRequests.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-6 text-slate-400">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">No pending withdrawal requests.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingRequests.map(req => (
                <div key={req.id} className="px-4 py-4" data-testid={`wr-row-${req.id}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-800">{req.vendor.storeName || req.vendor.momoName}</p>
                        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{req.vendor.phone}</p>
                      <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">Amount</span>
                          <span className="text-sm font-black text-amber-700">GHC {req.amount}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">MoMo Number</span>
                          <span className="text-xs font-bold text-slate-800">{req.momoNumber}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">MoMo Name</span>
                          <span className="text-xs font-bold text-slate-800">{req.momoName}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">Requested</span>
                          <span className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => approveMutation.mutate(req.id)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-wr-${req.id}`}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        onClick={() => rejectMutation.mutate({ id: req.id })}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-wr-${req.id}`}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent resolved */}
          {recentResolved.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recent History</p>
              <div className="space-y-2">
                {recentResolved.map(req => (
                  <div key={req.id} className="flex items-center justify-between gap-2 text-xs" data-testid={`wr-history-${req.id}`}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {req.status === "approved"
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      <span className="font-semibold text-slate-700 truncate">{req.vendor.storeName || req.vendor.momoName}</span>
                      <span className="text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span className={`font-bold flex-shrink-0 ${req.status === "approved" ? "text-emerald-600" : "text-slate-400"}`}>GHC {req.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vendor list */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-600" />
            <CardTitle className="text-base">All Vendors</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {vendorsLoading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Loading vendors...</div>
          ) : !vendors || vendors.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No vendors registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {vendors.map(row => (
                <VendorPayoutCard key={row.vendor.id} row={row} onRefresh={refresh} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Broadcast SMS Panel ──────────────────────────────────────────────────────
function BroadcastSmsPanel() {
  const { toast } = useToast();
  const MAX = 500;
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ total: number; sent: number; failed: number; errors: string[] } | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/broadcast-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: `SMS sent to ${data.sent} of ${data.total} vendors` });
    },
    onError: (err: any) => {
      toast({ title: "Broadcast failed", description: err.message, variant: "destructive" });
    },
  });

  const remaining = MAX - message.length;
  const isOverLimit = remaining < 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-purple-600" />
          <CardTitle className="text-base">Broadcast SMS to All Vendors</CardTitle>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Sends an SMS message to every registered vendor's phone number.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-slate-700">Message</Label>
            <span className={`text-xs font-medium ${isOverLimit ? "text-red-500" : remaining <= 50 ? "text-amber-500" : "text-slate-400"}`}>
              {remaining} remaining
            </span>
          </div>
          <textarea
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            rows={5}
            maxLength={MAX}
            placeholder="Type your message to all vendors here…"
            value={message}
            onChange={(e) => { setMessage(e.target.value); setResult(null); }}
          />
        </div>

        <Button
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 font-bold"
          disabled={!message.trim() || isOverLimit || broadcastMutation.isPending}
          onClick={() => broadcastMutation.mutate()}
        >
          {broadcastMutation.isPending
            ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />Sending…</span>
            : <span className="flex items-center gap-2"><Send className="w-4 h-4" />Send to All Vendors</span>}
        </Button>

        {result && (
          <div className={`rounded-lg px-4 py-3 text-sm space-y-1 ${result.failed === 0 ? "bg-green-50 border border-green-200 text-green-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
            <p className="font-semibold">
              {result.failed === 0
                ? `✓ Delivered to all ${result.sent} vendor${result.sent !== 1 ? "s" : ""}`
                : `Sent ${result.sent} / ${result.total} — ${result.failed} failed`}
            </p>
            {result.errors.length > 0 && (
              <ul className="text-xs space-y-0.5 mt-1 list-disc list-inside opacity-80">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "vendors" | "broadcast">("overview");

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
            { key: "broadcast", label: "Broadcast", icon: Send },
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

            {/* Manage Card Types */}
            <ManageCardTypesForm onUpdated={handleRefresh} />

            {/* Add Vouchers */}
            <AddVouchersForm onAdded={handleRefresh} />

            {/* Vendor Base Prices */}
            <VendorBasePricesForm cards={cards} onUpdated={handleRefresh} />

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
        ) : activeTab === "vendors" ? (
          <VendorsTab />
        ) : (
          <BroadcastSmsPanel />
        )}
      </div>
    </div>
  );
}
