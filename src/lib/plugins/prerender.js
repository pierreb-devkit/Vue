import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

/**
 * Serve a static file from the given directory.
 * @param {string} root - absolute path to the static directory
 * @param {import('node:http').IncomingMessage} req - incoming HTTP request
 * @param {import('node:http').ServerResponse} res - outgoing HTTP response
 * @returns {void}
 */
function staticHandler(root, req, res) {
  const url = req.url === '/' || !extname(req.url) ? '/index.html' : req.url;
  const filePath = join(root, url);
  const mimeTypes = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' };

  readFile(filePath)
    .then((data) => {
      res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    })
    .catch(() => {
      // SPA fallback — serve index.html for any unresolved path
      readFile(join(root, 'index.html'))
        .then((data) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(data);
        })
        .catch(() => {
          res.writeHead(404);
          res.end('Not Found');
        });
    });
}

/**
 * Vite plugin — pre-renders configured routes after build using Puppeteer.
 * Produces static HTML so search-engine crawlers receive real content
 * instead of an empty `<div id="app"></div>`.
 *
 * Only runs during production builds when `seo.prerender.enabled` is true.
 *
 * @param {object} config - app config object (src/config/index.js)
 * @returns {import('vite').Plugin | null} Vite plugin or null when disabled
 */
export function prerenderPlugin(config) {
  const prerender = config?.app?.seo?.prerender;
  if (!prerender?.enabled) return null;

  const routes = prerender.routes || ['/'];

  return {
    name: 'prerender-routes',
    enforce: 'post',
    apply: 'build',

    /**
     * Run Puppeteer after the bundle has been written to capture each route's
     * fully-rendered HTML and overwrite the corresponding output file.
     * @returns {Promise<void>}
     */
    async closeBundle() {
      const fs = await import('node:fs');
      const path = await import('node:path');

      // Resolve the dist directory relative to the project root
      const distDir = path.resolve('dist');

      if (!fs.existsSync(distDir)) {
        console.warn('[prerender] dist/ not found — skipping pre-render.');
        return;
      }

      console.log(`[prerender] Pre-rendering ${routes.length} route(s)…`);

      // Start a lightweight static file server for the built output
      const server = createServer((req, res) => staticHandler(distDir, req, res));
      await new Promise((resolve) => server.listen(0, resolve));
      const port = server.address().port;
      const origin = `http://localhost:${port}`;

      let browser;
      try {
        const puppeteer = await import('puppeteer');
        browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });

        for (const route of routes) {
          const url = `${origin}${route}`;
          console.log(`[prerender]   → ${route}`);

          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

          const html = await page.content();
          await page.close();

          // Determine output path — '/' → dist/index.html, '/about' → dist/about/index.html
          const filePath =
            route === '/'
              ? path.join(distDir, 'index.html')
              : path.join(distDir, route, 'index.html');

          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(filePath, html, 'utf-8');
        }

        console.log('[prerender] Done.');
      } catch (err) {
        console.error('[prerender] Pre-rendering failed:', err.message);
        console.error('[prerender] Build output is still valid without pre-rendering.');
      } finally {
        if (browser) await browser.close();
        await new Promise((resolve) => server.close(resolve));
      }
    },
  };
}
