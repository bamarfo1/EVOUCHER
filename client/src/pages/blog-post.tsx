import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Calendar, Globe, ArrowLeft, ExternalLink, ChevronRight } from "lucide-react";
import alltekseLogo from "@assets/alltekse_1777780378035.png";

interface BlogPost {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  category: string | null;
  publishedAt: string | null;
  createdAt: string;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" });
}

function categoryColor(cat: string | null) {
  if (cat === "University News") return "bg-blue-50 text-blue-700 border-blue-200";
  if (cat === "Official Announcement") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-purple-50 text-purple-700 border-purple-200";
}

function ContentBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => {
        if (para.startsWith("•")) {
          const items = para.split("\n").filter(Boolean);
          return (
            <ul key={i} className="list-none space-y-1 pl-1">
              {items.map((item, j) => (
                <li key={j} className="flex gap-2 text-slate-700 text-sm md:text-base leading-relaxed">
                  <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
                  <span>{item.replace(/^•\s*/, "")}</span>
                </li>
              ))}
            </ul>
          );
        }
        const lines = para.split("\n").filter(Boolean);
        return (
          <p key={i} className="text-slate-700 text-sm md:text-base leading-relaxed">
            {lines.join(" ")}
          </p>
        );
      })}
    </div>
  );
}

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog/posts", id],
    queryFn: async () => {
      const res = await fetch(`/api/blog/posts/${id}`);
      if (!res.ok) throw new Error("Post not found");
      return res.json();
    },
    enabled: !!id,
  });

  if (post) {
    document.title = `${post.title} | AllTekSE Education Blog`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", post.summary || post.title);
    const og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute("content", post.title);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #f8f7ff 0%, #eff6ff 50%, #f0fdfa 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-100/80 bg-white/90 backdrop-blur-xl shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <Link href="/" className="flex items-center gap-3">
            <img src={alltekseLogo} alt="AllTekSE Logo" className="h-10 w-auto object-contain rounded-lg" />
            <div>
              <p className="text-base font-extrabold leading-tight bg-gradient-to-r from-purple-700 via-blue-600 to-teal-600 bg-clip-text text-transparent">AllTekSE e-Voucher</p>
              <p className="text-[11px] text-slate-500 font-medium leading-tight">Education News</p>
            </div>
          </Link>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All News
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-10">
        <div className="max-w-3xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 flex-wrap">
            <Link href="/" className="hover:text-purple-600 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-purple-600 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-600 truncate max-w-[200px]">{post?.title || "Article"}</span>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="w-full h-72 rounded-xl" />
              <div className="space-y-3 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ) : post ? (
            <article className="space-y-6">
              {/* Meta */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-xs font-semibold ${categoryColor(post.category)}`}>
                    {post.category || "Education"}
                  </Badge>
                  {post.publishedAt && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {post.source}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">{post.title}</h1>
              </div>

              {/* Hero image */}
              {post.imageUrl && (
                <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden bg-purple-100">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                  />
                </div>
              )}

              {/* Content */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-5">

                  {/* Lead paragraph (bold summary) */}
                  {post.summary && (
                    <p className="text-slate-800 font-semibold text-sm md:text-base leading-relaxed border-l-4 border-purple-400 pl-4">
                      {post.summary}
                    </p>
                  )}

                  {/* Full article body */}
                  {post.content && post.content.trim().length > (post.summary?.length ?? 0) + 50 ? (
                    <ContentBody text={post.content} />
                  ) : null}

                  {/* Read full at source */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-xs text-slate-400">
                      This is a summary. Read the full article on the source website:
                    </p>
                    <Button
                      className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0"
                      onClick={() => window.open(post.sourceUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Read Full Article on {post.source}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs text-amber-700 font-medium">
                  This article is sourced from <strong>{post.source}</strong>. AllTekSE aggregates education news to keep students and parents informed across Ghana.
                </p>
              </div>

              {/* Back */}
              <div className="pt-2">
                <Link href="/blog">
                  <Button variant="outline" className="font-semibold border-slate-200">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All News
                  </Button>
                </Link>
              </div>
            </article>
          ) : (
            <div className="text-center py-20 space-y-4">
              <BookOpen className="w-12 h-12 text-purple-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-700">Article not found</h3>
              <Link href="/blog">
                <Button variant="outline">Back to Blog</Button>
              </Link>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
