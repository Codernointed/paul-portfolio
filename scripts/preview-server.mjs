#!/usr/bin/env node
// A local stand-in for the Vercel edge + static layer, used to verify the
// public endpoints without deploying: it runs site/request-router.mjs over
// real requests and serves the built output from disk exactly as Vercel's
// static layer would (including falling back to 404.html with a 404 status).
//
//   node scripts/preview-server.mjs [--dir portfolio-website/public] [--port 4173]
//
// External proxies (PostHog, the mobile OS deployment) are not followed; the
// response instead reports the target in an `x-preview-proxy-to` header so the
// decision can still be asserted. test/endpoints.test.mjs drives this server.

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { routeRequest } from '../site/request-router.mjs';

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

export function createPreviewServer({ rootDir = DEFAULT_DIR, host = 'paulbotchwey.com' } = {}) {
    return createServer(async (req, res) => {
        const headers = { ...req.headers };
        // Requests arrive on localhost; the router branches on the public host.
        headers.host = headers['x-forwarded-host'] ?? headers.host ?? host;
        if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(headers.host)) {
            headers.host = host;
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

        if (action.kind === 'proxy') {
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
