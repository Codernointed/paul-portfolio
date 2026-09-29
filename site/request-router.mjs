// Pure routing decisions for the edge middleware. Kept free of any runtime
// import so it can be unit-tested with plain node:test and bundled into the
// edge function unchanged.
//
// The middleware turns each returned action into a @vercel/functions call:
//   next        -> next({ headers })
//   rewrite     -> rewrite(target, { headers })   (same-origin path)
//   proxy       -> rewrite(absoluteUrl, { headers })
//   response    -> new Response(body, { status, headers })
//   redirect    -> new Response(null, { status: 302, headers })  (Location included)

import {
    AGENT_FILES,
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

// Accept, User-Agent and now the view-override cookie all change the
// response body (markdown negotiation, the mobile proxy, and a visitor's
// explicit 3D/2D choice from the toggle button), so every cache key has to
// include them.
export const VARY = 'Accept, Accept-Encoding, User-Agent, Cookie';

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

// The 2D OS's own build output - its JS bundle, CSS, js-dos game assets,
// favicon, manifest. These have to reach the edge function even though most
// of them end in a MIDDLEWARE_SKIPPED_EXTENSIONS extension: a mobile
// visitor's page load is proxied to codernointed-os.vercel.app
// (proxyToOS below), and the HTML that comes back references these exact
// paths - none of which exist anywhere in this shell deployment's own
// static output. If the edge function doesn't run for them, Vercel's
// static layer 404s them directly and routeRequest never gets a chance to
// proxy them - this shipped once already (mobile visitors got a blank
// white page because their OS page's own JS/CSS 404ed).
export const OS_MATCHED_PREFIXES = ['/static/', '/js-dos/'];
export const OS_MATCHED_EXACT_PATHS = [
    '/favicon.ico',
    '/manifest.json',
    '/asset-manifest.json',
    '/diag.html',
    '/digger.jsdos',
    '/doom.jsdos',
    '/scrabble.jsdos',
    '/trail.jsdos',
];

const SKIPPED_EXTENSION_REGEX = new RegExp(
    `\\.(?:${MIDDLEWARE_SKIPPED_EXTENSIONS.join('|')})$`,
    'i'
);

/**
 * Reproduces middleware.ts's config.matcher: true when the edge function
 * actually runs for this path on Vercel, false when Vercel's static layer
 * serves (or 404s) it directly without ever calling routeRequest.
 *
 * middleware.ts's own matcher has to be a hand-written literal (Vercel
 * statically parses it at build time and rejects a computed value - see the
 * comment there), so it cannot import this function. This is instead the
 * single source of truth everything else uses: scripts/preview-server.mjs
 * calls it so paths the matcher would skip are ALSO skipped in local
 * testing (the gap that let the bug above ship undetected - the preview
 * server used to run routeRequest for every path, matcher or not), and
 * test/middleware-matcher.test.mjs cross-checks middleware.ts's literal
 * against it so the two can't silently drift apart.
 */
export function isMatcherIncluded(pathname) {
    if (pathname.startsWith('/ingest/')) return true;
    if (OS_MATCHED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
    }
    if (OS_MATCHED_EXACT_PATHS.includes(pathname)) return true;
    return !SKIPPED_EXTENSION_REGEX.test(pathname);
}

// The generated agent/SEO files - always the shell's own copy, never
// proxied to the OS (see the exemption in routeRequest). Built once from
// AGENT_FILES so it can't drift from the actual generated file list.
const AGENT_FILE_PATHS = new Set(Object.values(AGENT_FILES));

function header(headers, name) {
    if (!headers) return '';
    if (typeof headers.get === 'function') return headers.get(name) ?? '';
    const direct = headers[name] ?? headers[name.toLowerCase()];
    return direct ?? '';
}

// Lets a visitor override the device-based 3D-shell-vs-2D-OS default and
// have it stick across navigation. Set by GET /__view/os or /__view/3d (see
// viewToggleResponse below); read back on every request via this cookie.
export const VIEW_COOKIE_NAME = 'view';
const VALID_VIEW_MODES = new Set(['os', '3d']);
const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Reads one cookie's value out of a raw `Cookie` request header. */
export function readCookie(headers, name) {
    const cookieHeader = header(headers, 'cookie');
    if (!cookieHeader) return undefined;
    for (const part of cookieHeader.split(';')) {
        const eq = part.indexOf('=');
        if (eq === -1) continue;
        if (part.slice(0, eq).trim() === name) {
            return decodeURIComponent(part.slice(eq + 1).trim());
        }
    }
    return undefined;
}

/**
 * The `?to=` a toggle redirect returns to must stay on this site - reject
 * anything that could send a visitor elsewhere (a scheme, a protocol-
 * relative `//host`, or a value that isn't even a path).
 */
function safeReturnPath(rawTo) {
    if (!rawTo || !rawTo.startsWith('/') || rawTo.startsWith('//')) return '/';
    if (/^\/[\t\n\r]*\//.test(rawTo)) return '/'; // e.g. "/\t/evil.example"
    try {
        // Resolving against a fixed origin both validates it (throws on a
        // malformed value) and normalizes it back to a same-origin path.
        const resolved = new URL(rawTo, 'https://paulbotchwey.com');
        if (resolved.origin !== 'https://paulbotchwey.com') return '/';
        return resolved.pathname + resolved.search;
    } catch {
        return '/';
    }
}

/**
 * GET /__view/os or /__view/3d: sets the view cookie and redirects back to
 * `?to=` (default "/"). Both the 3D shell and the 2D OS link here from an
 * always-visible toggle button so either can be reached from the other, on
 * any device.
 */
function viewToggleResponse(url) {
    const mode = url.pathname.slice('/__view/'.length);
    if (!VALID_VIEW_MODES.has(mode)) return null;

    const location = safeReturnPath(url.searchParams.get('to'));
    return {
        kind: 'redirect',
        headers: {
            Location: location,
            'Set-Cookie': `${VIEW_COOKIE_NAME}=${mode}; Path=/; Max-Age=${VIEW_COOKIE_MAX_AGE}; SameSite=Lax`,
            'Cache-Control': 'no-store',
        },
    };
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
 * @returns {{kind: 'next'|'rewrite'|'proxy'|'response'|'redirect', path?: string, url?: string, status?: number, body?: string, headers: Record<string,string>}}
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

    if (path.startsWith('/__view/')) {
        const toggle = viewToggleResponse(url);
        if (toggle) return toggle;
    }

    const innerSite = isInnerSiteHost(header(headers, 'host'));

    // Looked up early because both the markdown-negotiation check and the
    // OS-proxy decision below need to know whether this path is one of the
    // known page routes (undefined for asset paths and unknown paths).
    const route = routeForPath(path);

    // A client that explicitly asks for markdown always gets the shell's
    // markdown for that route, regardless of device or the view cookie -
    // this is what keeps an agent whose UA happens to look mobile-shaped
    // (some crawlers do) off the noindex OS deployment, which has almost no
    // server-rendered text for it to read. Bots already never get proxied
    // below, but a plain client requesting text/markdown does too, in case
    // its UA doesn't match the bot patterns. Never on the OS's own host,
    // though - no .md files exist in that deployment's build output.
    if (!innerSite && route && prefersMarkdown(header(headers, 'accept'))) {
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

    // Whether THIS visitor (by cookie override, else device) should see the
    // 2D OS rather than the 3D shell. Has to gate not just the page HTML
    // but every asset that page's own HTML references (its JS bundle, CSS,
    // js-dos assets, favicon, manifest - none of which exist in this shell
    // deployment's own static output, so they must be proxied too, not just
    // the page navigation). A visitor proxied to the OS's index.html only
    // ever requests OS-owned asset paths afterward - the shell's own asset
    // paths (bundle.js, textures, ...) are simply never referenced by that
    // page - so it's safe to route this decision ahead of the static-asset
    // short-circuit below. Bots never get proxied: the OS deployment is
    // deliberately noindex, and agents need the readable, structured-data-
    // bearing shell page regardless of what a human on the same browser
    // profile chose.
    const viewCookie = readCookie(headers, VIEW_COOKIE_NAME);
    const wantsOS =
        viewCookie === 'os' ? true : viewCookie === '3d' ? false : isMobileRequest(headers);
    const proxyToOS = !innerSite && wantsOS && !isBotRequest(headers);

    // Standalone pages (currently just /privacy) exist only on the shell
    // and always render here, regardless of device or the toggle - they
    // have no OS equivalent to proxy to, and none of their own asset needs
    // live under the OS's paths either. The generated agent/SEO files
    // (sitemap.xml, robots.txt, llms.txt, llms-full.txt, agents.md,
    // 404.html) get the same exemption: an automated tool that fetches
    // these directly (a directory checker, an SEO auditor, a link-preview
    // bot with a mobile-shaped UA that isBotRequest doesn't recognise)
    // needs the shell's own copy, not a 404 against whatever the OS
    // deployment happens to have at that path - it doesn't have most of
    // them, and where it does (its own /robots.txt), it's a different file
    // entirely, which would silently defeat the whole point of publishing
    // these for agents in the first place.
    if (
        proxyToOS &&
        (!route || route.kind !== 'standalone') &&
        !AGENT_FILE_PATHS.has(path)
    ) {
        return {
            kind: 'proxy',
            url: `${INNER_SITE_ORIGIN}${url.pathname}${url.search}`,
            headers: { Vary: VARY },
        };
    }

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

    // Reaching here, proxyToOS was false (or route was the exempt
    // standalone page) - render the shell's own file.
    return {
        kind: 'rewrite',
        path: `${route.file}${url.search}`,
        headers: { Vary: VARY, Link: markdownLinkHeader(route) },
    };
}

export { ROUTES };
