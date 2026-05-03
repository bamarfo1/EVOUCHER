import Parser from "rss-parser";
import { db } from "../db";
import { blogPosts } from "@shared/schema";

const parser = new Parser({
  timeout: 12000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; AllTekSE-NewsBot/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: false }],
      ["media:thumbnail", "media:thumbnail", { keepArray: false }],
      ["content:encoded", "content:encoded"],
    ],
  },
});

interface RssSource {
  name: string;
  url: string;
  category: string;
  filterByKeyword: boolean;
}

const RSS_SOURCES: RssSource[] = [
  // ── Major Ghanaian News (filtered by education keyword) ───────────────────
  {
    name: "JoyNews Ghana",
    url: "https://www.myjoyonline.com/feed/",
    category: "Education News",
    filterByKeyword: true,
  },
  {
    name: "3News Ghana",
    url: "https://3news.com/feed/",
    category: "Education News",
    filterByKeyword: true,
  },
  {
    name: "Ghana Business News",
    url: "https://www.ghanabusinessnews.com/feed/",
    category: "Education News",
    filterByKeyword: true,
  },
  // ── University RSS feeds (that actually work) ─────────────────────────────
  {
    name: "Ashesi University",
    url: "https://ashesi.edu.gh/feed",
    category: "University News",
    filterByKeyword: false,
  },
  {
    name: "GIMPA",
    url: "https://www.gimpa.edu.gh/news/feed",
    category: "University News",
    filterByKeyword: false,
  },
];

const EDUCATION_KEYWORDS = [
  "university", "universities",
  "school", "schools",
  "student", "students",
  "education", "educational",
  "academic", "academics",
  "exam", "exams", "examination",
  "waec", "bece", "wassce", "novdec",
  "degree", "degrees",
  "admission", "admissions",
  "graduate", "graduates", "graduation",
  "faculty", "college", "colleges",
  "tertiary", "secondary",
  "scholarship", "scholarships",
  "curriculum", "syllabus",
  "lecturer", "lecturers", "professor",
  "campus", "campuses",
  "knust", "legon", "ucc", "upsa", "ashesi", "gimpa",
  "ministry of education",
  "head teacher", "headmaster", "headmistress",
  "shs", "jhs", "basic school",
  "fees", "tuition", "results checker",
  "placement", "ghanaian students",
];

function isEducationRelated(title: string, summary: string): boolean {
  const titleLower = title.toLowerCase();
  const inTitle = EDUCATION_KEYWORDS.some((kw) => titleLower.includes(kw));
  if (inTitle) return true;
  const text = `${title} ${summary}`.toLowerCase();
  const matchCount = EDUCATION_KEYWORDS.filter((kw) => text.includes(kw)).length;
  return matchCount >= 2;
}

function extractImage(item: any): string | null {
  if (item["media:content"]?.["$"]?.url) return item["media:content"]["$"].url;
  if (item["media:thumbnail"]?.["$"]?.url) return item["media:thumbnail"]["$"].url;
  if (item.enclosure?.url) return item.enclosure.url;
  const rawHtml = item["content:encoded"] || item.content || "";
  const imgMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildSummary(fullText: string): string {
  const lines = fullText.split("\n").map(l => l.trim()).filter(Boolean);
  let summary = "";
  for (const line of lines) {
    summary += (summary ? " " : "") + line;
    if (summary.length >= 300) break;
  }
  return summary.slice(0, 400);
}

export async function fetchAndStorePosts(): Promise<number> {
  let inserted = 0;

  for (const source of RSS_SOURCES) {
    try {
      console.log(`[RSS] Fetching from ${source.name}...`);
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items || []) {
        const title = item.title?.trim() || "";
        const sourceUrl = item.link?.trim() || "";
        if (!title || !sourceUrl) continue;

        // Extract the richest available content
        const rawContent = item["content:encoded"] || item.content || "";
        const rawSnippet = item.contentSnippet || item.summary || "";

        // Full plain text: prefer HTML body (more complete)
        const fullText = rawContent
          ? stripHtml(rawContent)
          : stripHtml(rawSnippet);

        // Short teaser for grid cards
        const summary = buildSummary(fullText || rawSnippet);

        if (source.filterByKeyword && !isEducationRelated(title, summary + " " + fullText)) {
          continue;
        }

        const imageUrl = extractImage(item);
        const publishedAt = item.pubDate ? new Date(item.pubDate) : null;

        try {
          await db
            .insert(blogPosts)
            .values({
              title,
              summary,
              content: fullText.slice(0, 8000),
              source: source.name,
              sourceUrl,
              imageUrl,
              category: source.category,
              publishedAt,
            })
            .onConflictDoNothing();
          inserted++;
        } catch (_err) {
          // duplicate — skip silently
        }
      }
    } catch (err: any) {
      console.error(`[RSS] Error fetching ${source.name}:`, err.message);
    }
  }

  console.log(`[RSS] Done. ${inserted} new posts stored.`);
  return inserted;
}
