import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

export interface VendorMeta {
  storeName: string | null;
  slug: string;
}

type GetVendorBySlug = (slug: string) => Promise<VendorMeta | undefined>;

function injectVendorMeta(html: string, vendor: VendorMeta, baseUrl: string): string {
  const name = vendor.storeName || "Voucher Store";
  const url = `${baseUrl}/v/${vendor.slug}`;
  const description = `Buy WAEC result checker vouchers from ${name}. Instant delivery via SMS after payment.`;

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`)
    .replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${name}" />`)
    .replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:site_name"[^>]*\/?>/, `<meta property="og:site_name" content="${name}" />`)
    .replace(/<meta name="twitter:title"[^>]*\/?>/, `<meta name="twitter:title" content="${name}" />`)
    .replace(/<meta name="twitter:description"[^>]*\/?>/, `<meta name="twitter:description" content="${description}" />`)
    .replace(/<meta name="description"[^>]*\/?>/, `<meta name="description" content="${description}" />`)
    .replace(/<link rel="canonical"[^>]*\/?>/, `<link rel="canonical" href="${url}" />`);
}

function getBaseUrl(req: { hostname: string; protocol: string }): string {
  return (
    process.env.BASE_URL ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `${req.protocol}://${req.hostname}`)
  );
}

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server, getVendorBySlug?: GetVendorBySlug) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Inject vendor-specific meta tags for /v/:slug pages
      const vendorSlugMatch = url.match(/^\/v\/([^/?#]+)/);
      if (vendorSlugMatch && getVendorBySlug) {
        try {
          const vendor = await getVendorBySlug(vendorSlugMatch[1]);
          if (vendor) template = injectVendorMeta(template, vendor, getBaseUrl(req));
        } catch (_) { /* ignore lookup errors, serve default meta */ }
      }

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express, getVendorBySlug?: GetVendorBySlug) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Vendor pages: inject store-specific meta tags before serving
  if (getVendorBySlug) {
    app.get("/v/:slug", async (req, res, next) => {
      try {
        const vendor = await getVendorBySlug(req.params.slug);
        if (!vendor) return next();
        const indexPath = path.resolve(distPath, "index.html");
        let html = await fs.promises.readFile(indexPath, "utf-8");
        html = injectVendorMeta(html, vendor, getBaseUrl(req));
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
