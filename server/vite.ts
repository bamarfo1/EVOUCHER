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
  subdomain?: string | null;
}

type GetVendorBySlug = (slug: string) => Promise<VendorMeta | undefined>;
type GetVendorBySubdomain = (subdomain: string) => Promise<VendorMeta | undefined>;

function injectVendorMeta(html: string, vendor: VendorMeta, baseUrl: string, path?: string): string {
  const name = vendor.storeName || "Voucher Store";
  const urlPath = path || `/v/${vendor.slug}`;
  const url = `${baseUrl}${urlPath}`;
  const description = `Buy WAEC result checker vouchers from ${name}. Instant delivery via SMS after payment.`;

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`)
    .replace(/<meta property="og:title"[^>]*\/?>/, `<meta property="og:title" content="${name}" />`)
    .replace(/<meta property="og:description"[^>]*\/?>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta property="og:url"[^>]*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:site_name"[^>]*\/?>/, `<meta property="og:site_name" content="${name}" />`)
    // Remove the AllTekSE logo image from vendor link previews
    .replace(/<meta property="og:image"[^>]*\/?>/, `<meta property="og:image" content="" />`)
    .replace(/<meta name="twitter:card"[^>]*\/?>/, `<meta name="twitter:card" content="summary" />`)
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

export async function setupVite(app: Express, server: Server, getVendorBySlug?: GetVendorBySlug, getVendorBySubdomain?: GetVendorBySubdomain) {
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

      // Inject vendor-specific meta tags for /v/:slug and /:subdomain pages
      const vendorSlugMatch = url.match(/^\/v\/([^/?#]+)/);
      const vendorSubdomainMatch = !vendorSlugMatch && url.match(/^\/([^/?#v][^/?#]*)$/);
      if (vendorSlugMatch && getVendorBySlug) {
        try {
          const vendor = await getVendorBySlug(vendorSlugMatch[1]);
          if (vendor) template = injectVendorMeta(template, vendor, getBaseUrl(req));
        } catch (_) { /* ignore lookup errors, serve default meta */ }
      } else if (vendorSubdomainMatch && getVendorBySubdomain) {
        try {
          const vendor = await getVendorBySubdomain(vendorSubdomainMatch[1]);
          if (vendor) template = injectVendorMeta(template, vendor, getBaseUrl(req), `/${vendor.subdomain}`);
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

export function serveStatic(app: Express, getVendorBySlug?: GetVendorBySlug, getVendorBySubdomain?: GetVendorBySubdomain) {
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

  if (getVendorBySubdomain) {
    app.get("/:subdomain", async (req, res, next) => {
      try {
        const vendor = await getVendorBySubdomain(req.params.subdomain);
        if (!vendor) return next();
        const indexPath = path.resolve(distPath, "index.html");
        let html = await fs.promises.readFile(indexPath, "utf-8");
        html = injectVendorMeta(html, vendor, getBaseUrl(req), `/${vendor.subdomain}`);
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
