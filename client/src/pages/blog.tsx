import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Calendar, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

interface BlogPost {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: string | null;
  publishedAt: string | null;
  createdAt: string;
}

const PAGE_SIZE = 12;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GH", { year: "numeric", month: "short", day: "numeric" });
}

function MetaTags() {
  document.title = "Education News Blog | AllTekSE e-Voucher";
  const existing = document.querySelector('meta[name="description"]');
  if (existing) existing.setAttribute("content", "Stay updated with the latest Ghana education news — WAEC results, university admissions, scholarships, and academic updates from AllTekSE.");
  return null;
}

export default function BlogPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery<{ posts: BlogPost[]; total: number }>({
    queryKey: ["/api/blog/posts", page],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`);
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>
      <MetaTags />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-3">
            <img src={alltekseLogo} alt="AllTekSE Logo" className="h-10 w-auto object-contain rounded-lg" />
            <div>
              <h1 className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                AllTekSE e-Voucher
              </h1>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Education News</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-purple-700 transition-colors">Home</Link>
            <Link href="/retrieve-voucher" className="text-sm font-semibold text-slate-600 hover:text-purple-700 transition-colors">Retrieve Voucher</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-700 via-blue-700 to-teal-700 text-white py-12 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-3 py-1.5 rounded-full text-xs font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            Education News Hub
          </div>
          <h2 className="text-3xl md:text-4xl font-black">Ghana Education Updates</h2>
          <p className="text-white/80 text-sm md:text-base max-w-xl mx-auto">
            Latest news on WAEC results, university admissions, scholarships, and academic announcements — updated daily.
          </p>
        </div>
      </div>

      {/* Posts Grid */}
      <main className="flex-1 px-4 py-10">
        <div className="max-w-5xl mx-auto">

          {isLoading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="w-full h-44" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data && data.posts.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                {data.posts.map((post) => (
                  <Link key={post.id} href={`/blog/${post.id}`}>
                    <article className="group bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col cursor-pointer">
                      {/* Image */}
                      <div className="w-full h-44 bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden flex-shrink-0">
                        {post.imageUrl ? (
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-10 h-10 text-purple-300" />
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4 flex flex-col gap-2 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <Badge className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-semibold">
                            {post.category || "Education"}
                          </Badge>
                          {post.publishedAt && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.publishedAt)}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-slate-800 leading-snug group-hover:text-purple-700 transition-colors line-clamp-3">
                          {post.title}
                        </h3>

                        {post.summary && (
                          <p className="text-xs text-slate-500 line-clamp-2 flex-1">{post.summary}</p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {post.source}
                          </span>
                          <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </CardContent>
                    </article>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <span className="text-sm text-slate-500 font-medium">
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                    className="flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">No posts yet</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Education news articles are fetched daily. Check back soon for the latest updates.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white px-4 py-6 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <p className="text-slate-400">© 2025 ALLTEK SOLUTIONS & ENGINEERING</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">Home</Link>
            <Link href="/blog" className="text-slate-300 hover:text-white transition-colors">Blog</Link>
            <Link href="/retrieve-voucher" className="text-slate-300 hover:text-white transition-colors">Retrieve Voucher</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
