// Build-time prerender: crawls the built SPA in a real browser and saves the
// rendered HTML to dist/<path>/index.html, so crawlers (including AI bots that
// don't execute JavaScript) receive fully-formed pages containing the
// JSON-LD structured data the app renders client-side.
//
// How it works:
//   1. Serve dist/ on http://localhost:5000 with /api/* proxied to the real
//      backend (PRERENDER_API_TARGET). Port 5000 matters: apiConfig.js
//      resolves localhost to http://localhost:5000/api, so the app's own
//      runtime logic aims at our proxy — same-origin, no CORS issues.
//   2. Puppeteer (puppeteer-core + system Chromium; PUPPETEER_EXECUTABLE_PATH)
//      visits each public route, waits for the app to settle, saves the HTML.
//   3. server.js keeps serving prerendered files where they exist and falls
//      back to the SPA shell for everything else.
//
// Read-only against the API: the crawl only GETs public endpoints.

import { createServer } from 'http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { extname, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import {
  isPrerenderableRoute,
  prerenderOutputPath,
  PRERENDER_SEED_ROUTES
} from '../src/utils/prerenderRoutes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const PORT = Number(process.env.PRERENDER_PORT || 5000);
const API_TARGET = process.env.PRERENDER_API_TARGET || 'https://api.graphene-security.com/api';
// The bundle may bake the real API origin in (VITE_API_BASE_URL), so app
// fetches can go cross-origin straight to the API and die on CORS. Intercept
// those and reroute through the local proxy.
const API_ORIGIN_TO_REROUTE = process.env.PRERENDER_API_ORIGIN || 'https://api.graphene-security.com';
const MAX_PAGES = Number(process.env.PRERENDER_MAX_PAGES || 80);

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain',
  '.woff': 'font/woff', '.woff2': 'font/woff2'
};

const proxyToApi = (req, res) => {
  const target = new URL(API_TARGET + req.url.replace(/^\/api/, ''));
  const lib = target.protocol === 'https:' ? https : http;
  const upstream = lib.request(target, {
    method: req.method,
    headers: { ...req.headers, host: target.host }
  }, (upstreamRes) => {
    res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
    upstreamRes.pipe(res);
  });
  upstream.on('error', (error) => {
    console.error(`  proxy ${req.url} failed: ${error.message}`);
    res.writeHead(502);
    res.end();
  });
  req.pipe(upstream);
};

const startServer = () => new Promise((resolve) => {
  const server = createServer((req, res) => {
    if (req.url.startsWith('/api/')) {
      proxyToApi(req, res);
      return;
    }

    let filePath;
    if (req.url === '/' || !req.url.includes('.')) {
      filePath = join(DIST, 'index.html');
    } else {
      filePath = join(DIST, req.url.split('?')[0]);
    }

    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'text/plain' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  server.listen(PORT, 'localhost', () => resolve(server));
});

const findChromium = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    '/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable', '/snap/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error('No Chromium found — set PUPPETEER_EXECUTABLE_PATH');
};

const normaliseHref = (href) => {
  if (!href || !href.startsWith('/')) return null;
  return href.split('?')[0].split('#')[0] || '/';
};

const crawl = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('prerender-crawler/1.0 (+build-time)');

  // Serve API requests OURSELVES (server-side fetch has no CORS) and hand the
  // browser a synthesized same-origin response. continue({url}) is not enough:
  // the browser still evaluates CORS against the original cross-origin URL.
  // Covers bundles where VITE_API_BASE_URL baked in the real API origin; the
  // local /api proxy in startServer covers relative-path builds.
  await page.setRequestInterception(true);
  page.on('request', (intercepted) => {
    const url = intercepted.url();
    if (url.startsWith(`${API_ORIGIN_TO_REROUTE}/api`) || url.startsWith(`http://localhost:${PORT}/api`)) {
      const parsed = new URL(url);
      // Cross-origin URLs are already the full upstream URL; localhost ones
      // need rebuilding against API_TARGET (path arrives with the /api prefix).
      const upstreamUrl = url.startsWith(`${API_ORIGIN_TO_REROUTE}/api`)
        ? url
        : `${API_TARGET}${parsed.pathname.replace(/^\/api/, '')}${parsed.search}`;

      const corsHeaders = {
        'Access-Control-Allow-Origin': 'http://localhost:' + PORT,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };

      if (intercepted.method() === 'OPTIONS') {
        intercepted.respond({ status: 204, headers: corsHeaders });
        return;
      }

      fetch(upstreamUrl, {
        method: intercepted.method(),
        headers: { accept: intercepted.headers()['accept'] || 'application/json' },
        body: ['GET', 'HEAD'].includes(intercepted.method()) ? undefined : intercepted.postData()
      })
        .then(async (upstream) => {
          const body = await upstream.arrayBuffer();
          const headers = {
            'Content-Type': upstream.headers.get('content-type') || 'application/json',
            ...corsHeaders
          };
          intercepted.respond({ status: upstream.status, headers, body: Buffer.from(body) });
        })
        .catch((error) => {
          console.log(`  [api-intercept] ${upstreamUrl.slice(0, 90)} failed: ${error.message}`);
          intercepted.respond({ status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders }, body: '{"error":"prerender proxy failed"}' });
        });
    } else {
      intercepted.continue();
    }
  });

  const saved = [];
  const queue = [...PRERENDER_SEED_ROUTES];
  const seen = new Set(queue);

  // Seed every product slug from the API: link discovery alone misses
  // paginated catalog pages (only page 1 renders on /products).
  try {
    const response = await fetch(`${API_TARGET}/products?limit=100`);
    const payload = await response.json();
    const slugs = (payload?.data || []).map((product) => product.slug).filter(Boolean);
    for (const slug of slugs) {
      const route = `/products/${slug}`;
      if (!seen.has(route)) {
        seen.add(route);
        queue.push(route);
      }
    }
    console.log(`  seeded ${slugs.length} product slugs from the API`);
  } catch (error) {
    console.log(`  API slug seeding failed (${error.message}) — relying on link discovery`);
  }

  while (queue.length > 0 && saved.length < MAX_PAGES) {
    const route = queue.shift();
    if (!isPrerenderableRoute(route)) continue;

    try {
      await page.goto(`http://localhost:${PORT}${route}`, {
        waitUntil: 'networkidle2',
        timeout: 45000
      });
      // Wait for React to mount REAL content: a stuck loading state still
      // matches '#root *', so gate on visible text length instead.
      await page.waitForFunction(
        () => (document.querySelector('#root')?.innerText || '').trim().length > 100,
        { timeout: 20000 }
      );
      await new Promise((resolve) => setTimeout(resolve, 800));

      const html = await page.content();
      const hasContent = html.length > 1500 && html.includes('id="root"');
      if (!hasContent) {
        console.log(`  skip ${route} (no rendered content)`);
        continue;
      }

      const file = join(DIST, prerenderOutputPath(route));
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html);
      saved.push(route);
      console.log(`  saved ${route}`);

      // Discover more routes from the rendered DOM (product links etc.).
      const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.getAttribute('href')));
      for (const href of hrefs) {
        const next = normaliseHref(href);
        if (next && !seen.has(next) && isPrerenderableRoute(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    } catch (error) {
      console.log(`  failed ${route}: ${error.message.split('\n')[0]}`);
    }
  }

  await page.close();
  return saved;
};

const main = async () => {
  if (!existsSync(join(DIST, 'index.html'))) {
    throw new Error('dist/index.html not found — run `npm run build` first');
  }

  const puppeteer = await import('puppeteer-core');
  const server = await startServer();
  console.log(`🧭 Prerender: serving dist on :${PORT}, /api → ${API_TARGET}`);

  let browser;
  try {
    browser = await puppeteer.default.launch({
      executablePath: findChromium(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const saved = await crawl(browser);
    console.log(`✅ Prerendered ${saved.length} pages: ${saved.join(', ')}`);
    if (saved.length === 0) {
      console.warn('⚠️  No pages were prerendered — serving falls back to the SPA shell.');
    }
  } finally {
    if (browser) await browser.close();
    server.close();
  }
};

// Run directly (import.meta.url check keeps the module importable for tests)
if (process.argv[1] && process.argv[1].endsWith('prerender.mjs')) {
  main().catch((error) => {
    console.error('❌ Prerender failed:', error);
    process.exit(1);
  });
}
