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
export const config = {
    matcher: '/:path*',
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
