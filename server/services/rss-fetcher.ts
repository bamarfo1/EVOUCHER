import Parser from "rss-parser";
import { db } from "../db";
import { blogPosts } from "@shared/schema";
import { sql } from "drizzle-orm";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 AllTekSE-Blog-Fetcher/1.0",
  },
});

interface RssSource {
  name: string;
  url: string;
  category: string;
}

const RSS_SOURCES: RssSource[] = [
  {
    name: "JoyNews Ghana",
    url: "https://www.myjoyonline.com/feed/",
    category: "Education News",
  },
  {
    name: "Citi Newsroom",
    url: "https://citinewsroom.com/feed/",
    category: "Education News",
  },
  {
    name: "3News Ghana",
    url: "https://3news.com/feed/",
    category: "Education News",
  },
  {
    name: "Ghana Business News",
    url: "https://www.ghanabusinessnews.com/feed/",
    category: "Education News",
  },
  {
    name: "Pulse Ghana",
    url: "https://www.pulse.com.gh/feeds/rss.xml",
    category: "Education News",
  },
  {
    name: "Ghana Education News",
    url: "https://www.ghanaeducation.org/feed/",
    category: "Education News",
  },
];

const EDUCATION_KEYWORDS = [
  "university", "universities",
  "school", "schools", "schooling",
  "student", "students",
  "education", "educational",
  "academic", "academics",
  "exam", "exams", "examination",
  "waec", "bece", "wassce", "novdec", "abce",
  "degree", "degrees",
  "admission", "admissions",
  "graduate", "graduates", "graduation",
  "faculty", "college", "colleges",
  "tertiary", "secondary",
  "scholarship", "scholarships",
  "curriculum", "syllabus",
  "lecturer", "lecturers", "professor",
  "campus", "campuses",
  "knust", "ug legon", "legon", "ucc", "upsa", "ashesi",
  "ges ", "g.e.s", "ministry of education",
  "head teacher", "headmaster", "headmistress",
  "shs ", "jhs ", "basic school",
  "fees", "tuition", "results checker",
  "placement", "ghanaian students",
];

function isEducationRelated(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  // Require the match to be in the title, OR two matches anywhere
  const titleLower = title.toLowerCase();
  const inTitle = EDUCATION_KEYWORDS.some((kw) => titleLower.includes(kw));
  if (inTitle) return true;
  const matchCount = EDUCATION_KEYWORDS.filter((kw) => text.includes(kw)).length;
  return matchCount >= 2;
}

function extractImage(item: any): string | null {
  if (item["media:content"] && item["media:content"]["$"] && item["media:content"]["$"].url) {
    return item["media:content"]["$"].url;
  }
  if (item["media:thumbnail"] && item["media:thumbnail"]["$"] && item["media:thumbnail"]["$"].url) {
    return item["media:thumbnail"]["$"].url;
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  const imgMatch = (item.content || item["content:encoded"] || "").match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchAndStorePosts(): Promise<number> {
  let inserted = 0;

  for (const source of RSS_SOURCES) {
    try {
      console.log(`[RSS] Fetching from ${source.name}...`);
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items || []) {
        const title = item.title?.trim() || "";
        const summary = stripHtml(item.contentSnippet || item.content || item.summary || "");
        const sourceUrl = item.link?.trim() || "";

        if (!title || !sourceUrl) continue;
        if (!isEducationRelated(title, summary)) continue;

        const imageUrl = extractImage(item);
        const publishedAt = item.pubDate ? new Date(item.pubDate) : null;

        try {
          await db
            .insert(blogPosts)
            .values({
              title,
              summary: summary.slice(0, 500),
              content: summary,
              source: source.name,
              sourceUrl,
              imageUrl,
              category: source.category,
              publishedAt,
            })
            .onConflictDoNothing();
          inserted++;
        } catch (_err) {
          // duplicate or other insert error — skip
        }
      }
    } catch (err: any) {
      console.error(`[RSS] Error fetching ${source.name}:`, err.message);
    }
  }

  console.log(`[RSS] Done. ${inserted} new posts stored.`);
  return inserted;
}
