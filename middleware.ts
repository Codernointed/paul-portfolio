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
// IMPORTANT: Vercel statically parses `matcher` at build time, without
// executing any code - it must be a plain array of string literals. A value
// computed at runtime (a template literal interpolating an imported
// constant, a function call, a variable) breaks that static analysis and
// fails the build; this exact mistake broke the codernointed-os production
// deploy once already. The pattern below is hand-written from
// MIDDLEWARE_SKIPPED_EXTENSIONS; test/middleware-matcher.test.mjs asserts
// the two stay in sync, and separately asserts this config block contains
// no computed expression.
export const config = {
    matcher: [
        '/ingest/:path*',
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
        default:
            return next({ headers: action.headers });
    }
}
