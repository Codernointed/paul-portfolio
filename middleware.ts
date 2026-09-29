import { next, rewrite } from '@vercel/functions';
import { routeRequest } from './site/request-router.mjs';

// Vercel's Root Directory for BOTH projects (paul-portfolio and
// codernointed-os) is this monorepo root (see .vercel/repo.json), so this
// single middleware runs for both deployments. Behavior is branched on the
// request's Host header rather than build-time env vars, since env vars set
// for the build step aren't reliably available at Edge runtime.
//
// All of the decision-making lives in site/request-router.mjs so it can be
// unit-tested without an edge runtime; this file only translates the returned
// action into a Vercel response. That router is also what returns real HTTP
// 404s for unknown paths (the site used to answer 200 with the app shell for
// every path) and serves the markdown alternates for agents that send
// `Accept: text/markdown`.
//
// The matcher below is deliberately narrower than "every path". This is a
// static/3D site: most requests are large binary assets (textures, models,
// video, the JS bundle) that the router does nothing to but attach a Vary
// header with no real effect on a binary response - see
// MIDDLEWARE_SKIPPED_EXTENSIONS in site/request-router.mjs for the reasoning
// and the canonical extension list. Page routes (extensionless), the
// PostHog ingest proxy, and .md (the one extension that gets a real
// Content-Type override) all stay matched.
//
// The entries between /ingest/:path* and the extension-exclusion pattern
// are the 2D OS's own build output (its JS bundle, CSS, js-dos game
// assets, favicon, manifest). They have to stay matched even though most
// of them end in a skipped extension: a mobile visitor's page load gets
// proxied to codernointed-os.vercel.app (site/request-router.mjs -
// proxyToOS), and that proxied HTML references these exact paths, which
// don't exist anywhere in this shell deployment's own static output. If
// the middleware doesn't run for them, Vercel's static layer 404s them
// directly and the middleware never gets a chance to proxy them - this is
// a real bug that shipped once already (mobile visitors got a blank white
// page because their OS page's own JS/CSS 404ed). Listing them here costs
// nothing on the OS's own deployment (codernointed-os.vercel.app): there,
// these paths already exist in its own build output and the router serves
// them directly (see routeRequest's isInnerSiteHost branch), so running
// the router on them is a no-op, not a second network hop.
//
// IMPORTANT: Vercel statically parses `matcher` at build time, without
// executing any code - it must be a plain array of string literals. A value
// computed at runtime (a template literal interpolating an imported
// constant, a function call, a variable) breaks that static analysis and
// fails the build; this exact mistake broke the codernointed-os production
// deploy once already. The extension-exclusion pattern is hand-written from
// MIDDLEWARE_SKIPPED_EXTENSIONS; test/middleware-matcher.test.mjs asserts
// the two stay in sync, and separately asserts this config block contains
// no computed expression.
export const config = {
    matcher: [
        '/ingest/:path*',
        '/static/:path*',
        '/js-dos/:path*',
        '/favicon.ico',
        '/manifest.json',
        '/asset-manifest.json',
        '/diag.html',
        '/digger.jsdos',
        '/doom.jsdos',
        '/scrabble.jsdos',
        '/trail.jsdos',
        '/((?!.*\\.(?:jpg|jpeg|png|gif|svg|webp|avif|ico|mp4|mp3|wav|ogg|glb|gltf|drc|wasm|js|css|map|jsdos|symbols|json|ts)$).*)',
    ],
};

export default function middleware(request: Request) {
    const action = routeRequest({
        url: request.url,
        headers: request.headers,
    });

    switch (action.kind) {
        case 'proxy':
            return rewrite(action.url as string, { headers: action.headers });
        case 'rewrite':
            return rewrite(new URL(action.path as string, request.url), {
                headers: action.headers,
            });
        case 'response':
            return new Response(action.body, {
                status: action.status,
                headers: action.headers,
            });
        case 'redirect':
            return new Response(null, { status: 302, headers: action.headers });
        default:
            return next({ headers: action.headers });
    }
}
