import axios from "axios";
import * as cheerio from "cheerio";
import { db } from "../db";
import { blogPosts } from "@shared/schema";

const HTTP = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,*/*",
    "Accept-Language": "en-US,en;q=0.9",
  },
});

interface UniversitySource {
  name: string;
  newsUrl: string;
  baseUrl: string;
  articleSelector: string;
  titleSelector: string;
  linkSelector: string;
  imageSelector?: string;
  summarySelector?: string;
  articleContentSelector?: string;
}

const UNIVERSITIES: UniversitySource[] = [
  {
    name: "University of Ghana",
    newsUrl: "https://www.ug.edu.gh/news",
    baseUrl: "https://www.ug.edu.gh",
    articleSelector: ".views-row, article, .news-item, .view-content .item",
    titleSelector: "h3 a, h2 a, .field-content a, .views-field-title a",
    linkSelector: "h3 a, h2 a, .field-content a, .views-field-title a",
    imageSelector: "img",
    summarySelector: ".field-content p, .views-field-body, .summary",
  },
  {
    name: "KNUST",
    newsUrl: "https://knust.edu.gh/news",
    baseUrl: "https://knust.edu.gh",
    articleSelector: ".news-card, article, .post, .views-row",
    titleSelector: "h3 a, h2 a, .card-title a, .entry-title a",
    linkSelector: "h3 a, h2 a, .card-title a, .entry-title a",
    imageSelector: "img",
    summarySelector: "p, .excerpt, .card-body p",
  },
  {
    name: "University of Cape Coast",
    newsUrl: "https://ucc.edu.gh/news",
    baseUrl: "https://ucc.edu.gh",
    articleSelector: "article, .news-item, .views-row, .post",
    titleSelector: "h3 a, h2 a, .title a, .entry-title a",
    linkSelector: "h3 a, h2 a, .title a, .entry-title a",
    imageSelector: "img",
    summarySelector: ".summary, p, .excerpt",
  },
  {
    name: "UPSA Ghana",
    newsUrl: "https://upsa.edu.gh/news",
    baseUrl: "https://upsa.edu.gh",
    articleSelector: "article, .news-item, .post, .views-row",
    titleSelector: "h3 a, h2 a, .entry-title a",
    linkSelector: "h3 a, h2 a, .entry-title a",
    imageSelector: "img",
    summarySelector: "p, .excerpt",
  },
  {
    name: "Central University Ghana",
    newsUrl: "https://central.edu.gh/news",
    baseUrl: "https://central.edu.gh",
    articleSelector: "article, .news-card, .post",
    titleSelector: "h3 a, h2 a, .entry-title a",
    linkSelector: "h3 a, h2 a, .entry-title a",
    imageSelector: "img",
    summarySelector: "p, .excerpt",
  },
];

function resolveUrl(href: string, baseUrl: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/")) return `${baseUrl}${href}`;
  return `${baseUrl}/${href}`;
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

async function fetchArticleContent(url: string, uni: UniversitySource): Promise<{ content: string; image: string | null }> {
  try {
    const res = await HTTP.get(url);
    const $ = cheerio.load(res.data as string);

    // Remove navigation, footer, sidebar, scripts, styles
    $("nav, header, footer, aside, script, style, noscript, .nav, .menu, .sidebar, .widget, .comments, .comment, .breadcrumb, .pagination, .share, .related, .advertisement").remove();

    // Strategy 1: try known content wrappers
    const contentSelectors = [
      "article .entry-content",
      "article .post-content",
      ".single-post-content",
      ".article-body",
      ".article-content",
      ".field-items .field-item",
      ".node__content .field",
      ".post-body",
      ".td-post-content",
      "main article",
    ];

    let bodyHtml = "";
    for (const sel of contentSelectors) {
      const el = $(sel).first();
      if (el.length && el.text().trim().length > 150) {
        bodyHtml = el.html() || "";
        break;
      }
    }

    // Strategy 2: collect all paragraphs with real text (works for Elementor, Divi, etc.)
    if (!bodyHtml || stripHtml(bodyHtml).length < 150) {
      const paragraphs: string[] = [];
      $("p").each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 40 && !text.includes("©") && !text.includes("All Rights Reserved")) {
          paragraphs.push(text);
        }
      });
      if (paragraphs.length > 0) {
        bodyHtml = paragraphs.join("\n\n");
      }
    }

    const content = bodyHtml ? stripHtml(bodyHtml) : "";

    // Find main image — try featured image first, then any large image in article
    let image: string | null = null;
    const imgSelectors = [
      ".wp-post-image",
      "article img",
      ".featured-image img",
      ".hero-image img",
      ".post-thumbnail img",
      ".elementor-widget-image img",
      "main img",
    ];
    for (const sel of imgSelectors) {
      const imgEl = $(sel).first();
      const src = imgEl.attr("src");
      if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
        image = resolveUrl(src, uni.baseUrl);
        break;
      }
    }

    return { content: content.slice(0, 8000), image };
  } catch {
    return { content: "", image: null };
  }
}

async function scrapeUniversity(uni: UniversitySource): Promise<number> {
  let inserted = 0;
  try {
    console.log(`[Scraper] Fetching ${uni.name} news page...`);
    const res = await HTTP.get(uni.newsUrl);
    const $ = cheerio.load(res.data as string);

    const articles: { title: string; url: string; image: string | null; summary: string }[] = [];

    // Try multiple common article list patterns
    const listSelectors = [
      uni.articleSelector,
      "article",
      ".news-list li",
      ".views-row",
      ".card",
      ".post",
    ];

    for (const listSel of listSelectors) {
      const items = $(listSel);
      if (items.length < 2) continue;

      items.each((_, el) => {
        const $el = $(el);
        const linkEl = $el.find("a").first();
        const href = linkEl.attr("href") || "";
        const title = ($el.find("h1, h2, h3, h4").first().text().trim() || linkEl.text().trim()).replace(/\s+/g, " ");
        if (!title || title.length < 10 || !href) return;

        const fullUrl = resolveUrl(href, uni.baseUrl);
        if (!fullUrl.startsWith("http")) return;

        const imgSrc = $el.find("img").first().attr("src");
        const image = imgSrc ? resolveUrl(imgSrc, uni.baseUrl) : null;
        const summary = stripHtml($el.find("p").first().html() || "").slice(0, 400);

        articles.push({ title, url: fullUrl, image, summary });
      });

      if (articles.length > 0) break;
    }

    console.log(`[Scraper] ${uni.name}: found ${articles.length} articles`);

    // Fetch detail content for each article (limit to 15 to avoid rate limiting)
    for (const article of articles.slice(0, 15)) {
      if (!article.title || !article.url) continue;

      let content = article.summary;
      let image = article.image;

      // Fetch the full article page for better content
      const detail = await fetchArticleContent(article.url, uni);
      if (detail.content && detail.content.length > content.length) {
        content = detail.content;
      }
      if (!image && detail.image) {
        image = detail.image;
      }

      const summary = content.slice(0, 400).replace(/\n+/g, " ").trim();

      try {
        await db
          .insert(blogPosts)
          .values({
            title: article.title,
            summary,
            content: content.slice(0, 8000),
            source: uni.name,
            sourceUrl: article.url,
            imageUrl: image,
            category: "University News",
            publishedAt: null,
          })
          .onConflictDoNothing();
        inserted++;
      } catch {
        // duplicate — skip
      }

      // Small delay to be polite to servers
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (err: any) {
    console.error(`[Scraper] Error scraping ${uni.name}:`, err.message);
  }

  return inserted;
}

export async function scrapeUniversityNews(): Promise<number> {
  let total = 0;
  for (const uni of UNIVERSITIES) {
    const count = await scrapeUniversity(uni);
    console.log(`[Scraper] ${uni.name}: ${count} new articles stored`);
    total += count;
  }
  console.log(`[Scraper] Done. ${total} university articles stored.`);
  return total;
}
