// Pure routing decisions for the edge middleware. Kept free of any runtime
// import so it can be unit-tested with plain node:test and bundled into the
// edge function unchanged.
//
// The middleware turns each returned action into a @vercel/functions call:
//   next        -> next({ headers })
//   rewrite     -> rewrite(target, { headers })   (same-origin path)
//   proxy       -> rewrite(absoluteUrl, { headers })
//   response    -> new Response(body, { status, headers })

import {
    ROUTES,
    normalizePath,
    routeForMarkdownPath,
    routeForPath,
} from './site-meta.mjs';
import { notFoundHtml, notFoundMarkdown } from './not-found.mjs';

export const INNER_SITE_ORIGIN = 'https://codernointed-os.vercel.app';
const POSTHOG_INGEST_ORIGIN = 'https://eu.i.posthog.com';
const POSTHOG_ASSETS_ORIGIN = 'https://eu-assets.i.posthog.com';

export const MARKDOWN_TYPE = 'text/markdown; charset=utf-8';

// Accept and User-Agent both change the response body (markdown negotiation
// and the mobile proxy), so every cache key has to include them.
export const VARY = 'Accept, Accept-Encoding, User-Agent';

const MOBILE_UA_REGEX =
    /Android|iPhone|iPod|iPad|IEMobile|BlackBerry|Opera Mini|webOS|Windows Phone|Mobile/i;

// Crawlers and agents must never be handed the mobile OS deployment: it is a
// separate origin that is deliberately marked noindex. They get the shell
// HTML, which carries the readable content and the structured data.
const BOT_UA_REGEX =
    /bot|crawler|spider|crawling|slurp|facebookexternalhit|embedly|quora link preview|showyoubot|outbrain|pinterest|w3c_validator|whatsapp|telegram|discord|gptbot|oai-searchbot|chatgpt-user|perplexity|claude-web|claudebot|anthropic-ai|google-extended|applebot|amazonbot|bytespider|ccbot|diffbot|meta-external|duckduckbot|yandex|linkedinbot|twitterbot|slackbot|curl|wget|python-requests|node-fetch|axios|go-http-client|httpie|headlesschrome|lighthouse|ora-audit/i;

// A path that looks like a file is served (or 404ed) by the static layer.
const FILE_EXTENSION_REGEX = /\.[a-z0-9]{1,8}$/i;

const PASSTHROUGH_PREFIXES = ['/api/', '/.well-known/', '/js-dos/'];

// Extensions the router never attaches meaningful headers to - a static
// asset path always falls through to `next` with, at most, a Vary header
// that has no real effect on a binary response (nothing content-negotiates
// an image, video, font, or compiled bundle by Accept or User-Agent). These
// are the two deployments' actual asset extensions - see
// `middleware.ts`'s `config.matcher`, which skips these entirely so the
// edge function doesn't run per-request on every model, texture, video and
// bundle chunk. `.md` is deliberately absent: it is the one extension that
// gets a real header override (Content-Type: text/markdown, the
// acceptmarkdown.com fix), so it must keep going through the router.
export const MIDDLEWARE_SKIPPED_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'svg',
    'webp',
    'avif',
    'ico',
    'mp4',
    'mp3',
    'wav',
    'ogg',
    'glb',
    'gltf',
    'drc',
    'wasm',
    'js',
    'css',
    'map',
    'jsdos',
    'symbols',
    'json',
    'ts',
];

function header(headers, name) {
    if (!headers) return '';
    if (typeof headers.get === 'function') return headers.get(name) ?? '';
    const direct = headers[name] ?? headers[name.toLowerCase()];
    return direct ?? '';
}

/**
 * Parses an Accept header into media types with their q values.
 * @returns {{type: string, q: number}[]}
 */
export function parseAccept(accept) {
    return String(accept || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const [type, ...params] = part.split(';').map((p) => p.trim());
            const qParam = params.find((p) => /^q=/i.test(p));
            const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
            return {
                type: type.toLowerCase(),
                q: Number.isFinite(q) ? q : 1,
            };
        });
}

/**
 * acceptmarkdown.com negotiation: serve markdown only when the client asked
 * for `text/markdown` explicitly and did not rank HTML above it. A browser's
 * `text/html,...,*\/*;q=0.8` never matches, so humans keep getting the site.
 */
export function prefersMarkdown(accept) {
    const entries = parseAccept(accept);
    let markdownQ = 0;
    let htmlQ = 0;
    for (const entry of entries) {
        if (entry.type === 'text/markdown' || entry.type === 'text/x-markdown') {
            markdownQ = Math.max(markdownQ, entry.q);
        }
        if (
            entry.type === 'text/html' ||
            entry.type === 'application/xhtml+xml'
        ) {
            htmlQ = Math.max(htmlQ, entry.q);
        }
    }
    return markdownQ > 0 && markdownQ >= htmlQ;
}

export function acceptsHtml(accept) {
    return parseAccept(accept).some(
        (entry) =>
            entry.q > 0 &&
            (entry.type === 'text/html' ||
                entry.type === 'application/xhtml+xml')
    );
}

export function isBotRequest(headers) {
    return BOT_UA_REGEX.test(header(headers, 'user-agent'));
}

export function isMobileRequest(headers) {
    // Chromium client hint wins when present (also respects an explicit
    // "Request Desktop Site" toggle). Safari/Firefox fall back to UA text.
    const chMobile = header(headers, 'sec-ch-ua-mobile');
    if (chMobile === '?1') return true;
    if (chMobile === '?0') return false;
    return MOBILE_UA_REGEX.test(header(headers, 'user-agent'));
}

export function isStaticAssetPath(pathname) {
    return (
        FILE_EXTENSION_REGEX.test(pathname) ||
        PASSTHROUGH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    );
}

/** The inner OS deployment answers on its own vercel.app hostname. */
export function isInnerSiteHost(host) {
    return String(host || '').includes('codernointed-os');
}

function posthogProxyTarget(url) {
    if (url.pathname.startsWith('/ingest/static/')) {
        return (
            POSTHOG_ASSETS_ORIGIN +
            url.pathname.replace('/ingest/static/', '/static/') +
            url.search
        );
    }
    if (url.pathname.startsWith('/ingest/')) {
        return (
            POSTHOG_INGEST_ORIGIN + url.pathname.replace('/ingest', '') + url.search
        );
    }
    return null;
}

function markdownLinkHeader(route) {
    return `<${route.markdown}>; rel="alternate"; type="text/markdown"`;
}

/**
 * @param {{url: string, headers?: any}} request
 * @returns {{kind: 'next'|'rewrite'|'proxy'|'response', path?: string, url?: string, status?: number, body?: string, headers: Record<string,string>}}
 */
export function routeRequest(request) {
    const url = new URL(request.url);
    const headers = request.headers;
    const path = normalizePath(url.pathname);

    // Analytics proxy takes priority for every visitor on either project.
    const posthogTarget = posthogProxyTarget(url);
    if (posthogTarget) {
        return { kind: 'proxy', url: posthogTarget, headers: {} };
    }

    const innerSite = isInnerSiteHost(header(headers, 'host'));

    if (isStaticAssetPath(path)) {
        // Markdown alternates are static files, but they still need the
        // negotiation headers so caches key them correctly.
        const mdRoute = routeForMarkdownPath(path);
        if (mdRoute || path.endsWith('.md')) {
            return {
                kind: 'next',
                headers: { 'Content-Type': MARKDOWN_TYPE, Vary: VARY },
            };
        }
        return { kind: 'next', headers: { Vary: VARY } };
    }

    const route = routeForPath(path);

    if (!route) {
        const wantsHtml = acceptsHtml(header(headers, 'accept'));
        return {
            kind: 'response',
            status: 404,
            body: wantsHtml
                ? notFoundHtml(url.pathname)
                : notFoundMarkdown(url.pathname),
            headers: {
                'Content-Type': wantsHtml
                    ? 'text/html; charset=utf-8'
                    : MARKDOWN_TYPE,
                'Cache-Control': 'no-store',
                'X-Robots-Tag': 'noindex',
                Vary: VARY,
            },
        };
    }

    // The OS deployment is a plain SPA: every known route renders index.html.
    if (innerSite) {
        return { kind: 'rewrite', path: `/index.html${url.search}`, headers: {} };
    }

    if (prefersMarkdown(header(headers, 'accept'))) {
        return {
            kind: 'rewrite',
            path: route.markdown,
            headers: {
                'Content-Type': MARKDOWN_TYPE,
                Vary: VARY,
                Link: markdownLinkHeader(route),
            },
        };
    }

    const htmlHeaders = { Vary: VARY, Link: markdownLinkHeader(route) };

    // Mobile visitor on the 3D shell's domain: proxy straight to the OS
    // content, address bar stays on the shell's own domain. Standalone pages
    // (the privacy policy) exist only here, and bots always get this origin.
    if (route.kind === 'os' && isMobileRequest(headers) && !isBotRequest(headers)) {
        return {
            kind: 'proxy',
            url: `${INNER_SITE_ORIGIN}${url.pathname}${url.search}`,
            headers: htmlHeaders,
        };
    }

    return {
        kind: 'rewrite',
        path: `${route.file}${url.search}`,
        headers: htmlHeaders,
    };
}

export { ROUTES };
