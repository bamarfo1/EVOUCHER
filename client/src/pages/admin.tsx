import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, CreditCard, TrendingUp, LogOut, Plus, Image, Trash2, ChevronDown, ChevronUp, Package } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CardSummary {
  examType: string; total: number; used: number; available: number; price: number; imageUrl: string | null;
}
interface SalesByType { examType: string; count: number; revenue: number; }
interface SalesSummary { totalSales: number; totalRevenue: number; byType: SalesByType[]; }
interface AdminSummary { sales: SalesSummary; cards: CardSummary[]; }
interface Transaction { id: string; phone: string; email: string | null; examType: string; amount: number; status: string; createdAt: string; paystackReference: string; }

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

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

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

      <div className="max-w-4xl mx-auto p-4 space-y-4">
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
                <div key={card.examType} className="flex items-center gap-3 px-4 py-3" data-testid={`card-row-${card.examType}`}>
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
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{card.available} left</Badge>
                    <Badge variant={card.used > 0 ? "default" : "outline"} className="text-xs">{card.used} sold</Badge>
                  </div>
                </div>
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
      </div>
    </div>
  );
}
