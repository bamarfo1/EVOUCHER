import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, Search, CheckCircle2, XCircle, Copy, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

type VoucherResult = {
  serial: string;
  pin: string;
  examType: string;
};

export default function RetrieveVoucher() {
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VoucherResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !date) {
      toast({ title: "Missing Information", description: "Please enter both phone number and purchase date", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResults(null);
    setError(null);

    try {
      const res = await fetch(`/api/voucher/retrieve?phone=${encodeURIComponent(phone)}&date=${encodeURIComponent(date)}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "No voucher found for this phone number and date.");
      } else {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : [data]);
      }
    } catch {
      setError("Failed to retrieve voucher. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-3">
            <img src={alltekseLogo} alt="AllTekSE Logo" className="h-10 w-auto object-contain rounded-lg" data-testid="img-alltekse-logo" />
            <div>
              <p className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">AllTekSE e-Voucher</p>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Your Trusted e-Voucher Store</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="max-w-xl mx-auto space-y-6">

          {/* Page heading */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg mb-2">
              <Search className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-800">Retrieve Your Voucher</h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Enter the phone number used during purchase and the purchase date — we'll find all your vouchers for that day.
            </p>
          </div>

          {/* Search form */}
          <Card className="border-slate-200 shadow-md overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-teal-500" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-700 flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-500" />
                Voucher Lookup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0591234567 or +233591234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-purple-500"
                      required
                      data-testid="input-retrieve-phone"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Any format works: 059..., 233059..., or +233059...</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-sm font-semibold text-slate-700">Purchase Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="pl-10 h-11 border-slate-200 focus-visible:ring-purple-500"
                      required
                      data-testid="input-retrieve-date"
                    />
                  </div>
                  <p className="text-xs text-slate-400">Select the exact date you made the purchase</p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 font-bold text-white border-0 shadow-md"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
                  disabled={isLoading}
                  data-testid="button-retrieve-search"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isLoading ? "Searching..." : "Find My Vouchers"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {!isLoading && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-2" data-testid="result-error">
              <XCircle className="w-10 h-10 text-red-400 mx-auto" />
              <h3 className="text-base font-bold text-red-700">Voucher Not Found</h3>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-400">Try a different date or phone format, or contact support.</p>
            </div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="space-y-4" data-testid="result-success">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-800">
                  {results.length} Voucher{results.length > 1 ? "s" : ""} Found
                </h3>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold ml-auto">
                  {new Date(date).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                </Badge>
              </div>

              {results.map((voucher, idx) => (
                <Card key={idx} className="border-slate-200 shadow-sm overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="text-xs bg-purple-50 text-purple-700 border-purple-200 font-bold">
                        {voucher.examType}
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">Voucher {idx + 1} of {results.length}</span>
                    </div>

                    {/* Serial */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Serial Number</p>
                      <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
                        <p className="text-sm font-black font-mono tracking-widest text-slate-800" data-testid="text-serial">
                          {voucher.serial}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(voucher.serial, `serial-${idx}`, "Serial number")}
                          data-testid="button-copy-serial"
                          className="text-xs flex-shrink-0 text-slate-400 hover:text-purple-700"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          {copiedKey === `serial-${idx}` ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </div>

                    {/* PIN */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">PIN</p>
                      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-3 py-2.5">
                        <p className="text-lg font-black font-mono tracking-widest text-purple-800" data-testid="text-pin">
                          {voucher.pin}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(voucher.pin, `pin-${idx}`, "PIN")}
                          data-testid="button-copy-pin"
                          className="text-xs flex-shrink-0 text-purple-400 hover:text-purple-700"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          {copiedKey === `pin-${idx}` ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center gap-1.5 text-xs text-slate-400 justify-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Keep your voucher details safe and secure.
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-4 py-6 mt-auto">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-slate-400">© 2025 ALLTEK SOLUTIONS & ENGINEERING</p>
          <Link href="/" className="text-slate-300 hover:text-white transition-colors" data-testid="link-back-home">Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}
