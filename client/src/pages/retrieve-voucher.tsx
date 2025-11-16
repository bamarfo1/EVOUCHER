import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Calendar, Search, CheckCircle2, XCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type VoucherResponse = {
  serial: string;
  pin: string;
  examType: string;
};

export default function RetrieveVoucher() {
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [searchQuery, setSearchQuery] = useState<{ phone: string; date: string } | null>(null);
  const { toast } = useToast();

  const { data: voucher, isLoading, error } = useQuery<VoucherResponse>({
    queryKey: ['/api/voucher/retrieve', searchQuery?.phone, searchQuery?.date],
    enabled: !!searchQuery,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !date) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and purchase date",
        variant: "destructive",
      });
      return;
    }
    setSearchQuery({ phone, date });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
            Retrieve Your Voucher
          </h1>
          <p className="text-muted-foreground">
            Enter your phone number and purchase date to retrieve your WAEC voucher
          </p>
        </div>

        <Card className="shadow-2xl border-2 border-purple-100 dark:border-purple-900">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              Voucher Lookup
            </CardTitle>
            <CardDescription>
              We'll find your voucher using your phone number and purchase date
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="059918713 or +233599188713"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="input-retrieve-phone"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter in any format: 059918713, 233599188713, or +233599188713
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Purchase Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10 h-12"
                    required
                    data-testid="input-retrieve-date"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Select the date you purchased the voucher
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-12 md:h-14 text-base md:text-lg font-bold shadow-xl bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 hover:from-purple-700 hover:via-blue-700 hover:to-teal-700 text-white border-0"
                disabled={isLoading}
                data-testid="button-retrieve-search"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  {isLoading ? "Searching..." : "Search Voucher"}
                </span>
              </Button>
            </form>

            {/* Results Section */}
            {searchQuery && !isLoading && (
              <div className="mt-6 pt-6 border-t">
                {error ? (
                  <div className="bg-red-50 dark:bg-red-950 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 text-center" data-testid="result-error">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-2">
                      Voucher Not Found
                    </h3>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      No voucher found for this phone number and date. Please check your details and try again.
                    </p>
                  </div>
                ) : voucher ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800 rounded-xl p-6" data-testid="result-success">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h3 className="text-xl font-bold text-green-700 dark:text-green-300">
                        Voucher Found!
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold text-muted-foreground">Serial Number</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(voucher.serial, "Serial number")}
                            data-testid="button-copy-serial"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-serial">
                          {voucher.serial}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border-2 border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-semibold text-muted-foreground">PIN</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(voucher.pin, "PIN")}
                            data-testid="button-copy-pin"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-pin">
                          {voucher.pin}
                        </p>
                      </div>

                      {voucher.examType && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border-2 border-teal-200 dark:border-teal-800">
                          <Label className="text-sm font-semibold text-muted-foreground">Exam Type</Label>
                          <p className="text-lg font-bold text-teal-600 dark:text-teal-400 uppercase" data-testid="text-exam-type">
                            {voucher.examType.replace('-', ' ')}
                          </p>
                        </div>
                      )}

                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Note:</strong> Keep your voucher details safe. Use them to check your WAEC results online.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <a 
            href="/" 
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold underline"
            data-testid="link-back-home"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
