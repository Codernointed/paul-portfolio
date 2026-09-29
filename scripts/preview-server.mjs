#!/usr/bin/env node
// A local stand-in for the Vercel edge + static layer, used to verify the
// public endpoints without deploying: it runs site/request-router.mjs over
// real requests and serves the built output from disk exactly as Vercel's
// static layer would (including falling back to 404.html with a 404 status).
//
//   node scripts/preview-server.mjs [--dir portfolio-website/public] [--port 4173]
//
// Paths middleware.ts's matcher would skip bypass routeRequest entirely,
// exactly like on Vercel - going straight to routeRequest for every path
// regardless of the matcher is what let a real bug ship undetected once
// (mobile visitors' proxied OS page couldn't load its own JS/CSS, because
// the matcher never even ran the edge function for those paths - see
// isMatcherIncluded in site/request-router.mjs).
//
// External proxies (PostHog, the mobile OS deployment) are not followed; the
// response instead reports the target in an `x-preview-proxy-to` header so the
// decision can still be asserted. test/endpoints.test.mjs drives this server.

import { createServer, request as httpRequest } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { INNER_SITE_ORIGIN, isMatcherIncluded, routeRequest } from '../site/request-router.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = resolve(SCRIPT_DIR, '../portfolio-website/public');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.webp': 'image/webp',
    '.glb': 'model/gltf-binary',
    '.wasm': 'application/wasm',
};

function contentTypeFor(filePath) {
    return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function resolveFile(rootDir, pathname) {
    const relative = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
    let filePath = join(rootDir, relative);
    try {
        const stats = await stat(filePath);
        if (stats.isDirectory()) filePath = join(filePath, 'index.html');
        else return filePath;
        await stat(filePath);
        return filePath;
    } catch {
        return null;
    }
}

async function sendFile(res, filePath, extraHeaders) {
    const headers = { 'Content-Type': contentTypeFor(filePath), ...extraHeaders };
    res.writeHead(200, headers);
    createReadStream(filePath).pipe(res);
}

async function sendNotFoundPage(res, rootDir, extraHeaders) {
    const filePath = join(rootDir, '404.html');
    try {
        const body = await readFile(filePath, 'utf8');
        res.writeHead(404, {
            'Content-Type': 'text/html; charset=utf-8',
            ...extraHeaders,
        });
        res.end(body);
    } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found\n');
    }
}

/**
 * Real HTTP proxy to `targetOrigin`, forcing the Host header the way Vercel's
 * rewrite() would - fetch() refuses to override Host (it's a forbidden
 * header per spec), so this uses node:http directly. Used when a test opts
 * into `realProxyTo` to verify a proxied page's own asset requests actually
 * resolve, not just that the initial page fetch was routed correctly.
 */
function proxyReal(targetUrlString, targetOrigin, forwardHeaders) {
    return new Promise((resolvePromise, reject) => {
        const targetUrl = new URL(targetUrlString);
        const upstreamReq = httpRequest(
            {
                hostname: targetUrl.hostname,
                port: targetUrl.port,
                path: targetUrl.pathname + targetUrl.search,
                method: 'GET',
                headers: { ...forwardHeaders, host: new URL(targetOrigin).host },
            },
            (upstreamRes) => {
                const chunks = [];
                upstreamRes.on('data', (chunk) => chunks.push(chunk));
                upstreamRes.on('end', () =>
                    resolvePromise({
                        status: upstreamRes.statusCode,
                        contentType: upstreamRes.headers['content-type'],
                        body: Buffer.concat(chunks),
                    })
                );
            }
        );
        upstreamReq.on('error', reject);
        upstreamReq.end();
    });
}

/**
 * @param {object} [options]
 * @param {string} [options.rootDir]
 * @param {string} [options.host]
 * @param {string} [options.realProxyTo] - When set, 'proxy' actions whose
 *   target starts with INNER_SITE_ORIGIN are genuinely fetched from this
 *   local origin instead of returning the `x-preview-proxy-to` stub - a
 *   faithful reproduction of the mobile-proxy path for tests that need to
 *   verify the proxied page's own assets actually resolve (not just that
 *   the initial fetch was routed correctly), which is what let a real bug
 *   ship undetected once (see the file header comment).
 */
export function createPreviewServer({ rootDir = DEFAULT_DIR, host = 'paulbotchwey.com', realProxyTo } = {}) {
    return createServer(async (req, res) => {
        const headers = { ...req.headers };
        // Requests arrive on localhost; the router branches on the public host.
        headers.host = headers['x-forwarded-host'] ?? headers.host ?? host;
        if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(headers.host)) {
            headers.host = host;
        }

        const pathname = new URL(req.url, `https://${headers.host}`).pathname;
        if (!isMatcherIncluded(pathname)) {
            // Vercel's static layer serves this directly - the edge
            // function, and therefore routeRequest, never runs.
            const filePath = await resolveFile(rootDir, pathname);
            if (!filePath) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Not Found (static layer, matcher-skipped)\n');
                return;
            }
            await sendFile(res, filePath, {});
            return;
        }

        const action = routeRequest({
            url: `https://${headers.host}${req.url}`,
            headers,
        });

        if (action.kind === 'response') {
            res.writeHead(action.status, action.headers);
            res.end(action.body);
            return;
        }

        if (action.kind === 'redirect') {
            res.writeHead(302, action.headers);
            res.end();
            return;
        }

        if (action.kind === 'proxy') {
            if (realProxyTo && action.url.startsWith(INNER_SITE_ORIGIN)) {
                const target = action.url.replace(INNER_SITE_ORIGIN, realProxyTo);
                const upstream = await proxyReal(target, INNER_SITE_ORIGIN, {
                    'user-agent': headers['user-agent'] || '',
                    accept: headers.accept || '*/*',
                });
                res.writeHead(upstream.status, {
                    'content-type': upstream.contentType || 'application/octet-stream',
                    ...action.headers,
                });
                res.end(upstream.body);
                return;
            }
            res.writeHead(200, {
                ...action.headers,
                'Content-Type': 'text/plain; charset=utf-8',
                'x-preview-proxy-to': action.url,
            });
            res.end(`preview: would proxy to ${action.url}\n`);
            return;
        }

        const target = new URL(
            action.kind === 'rewrite' ? action.path : req.url,
            `https://${headers.host}`
        );
        const filePath = await resolveFile(rootDir, target.pathname);
        if (!filePath) {
            await sendNotFoundPage(res, rootDir, action.headers);
            return;
        }
        await sendFile(res, filePath, action.headers);
    });
}

const invokedDirectly =
    process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const dirArg = process.argv.indexOf('--dir');
    const portArg = process.argv.indexOf('--port');
    const rootDir = dirArg === -1 ? DEFAULT_DIR : resolve(process.argv[dirArg + 1]);
    const port = portArg === -1 ? 4173 : Number(process.argv[portArg + 1]);
    createPreviewServer({ rootDir }).listen(port, () => {
        console.log(`preview server: http://localhost:${port} serving ${rootDir}`);
    });
}
