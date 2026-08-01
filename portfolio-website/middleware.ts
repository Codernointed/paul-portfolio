import { next, rewrite } from '@vercel/functions';

// Full catch-all: both the initial document and every asset request
// (from whichever app ends up being served) must pass through here.
export const config = {
    matcher: '/:path*',
};

const MOBILE_UA_REGEX =
    /Android|iPhone|iPod|iPad|IEMobile|BlackBerry|Opera Mini|webOS|Windows Phone|Mobile/i;

const INNER_SITE_ORIGIN = 'https://codernointed-os.vercel.app';

// PostHog reverse proxy. Requests to eu.i.posthog.com are widely blocked by
// ad blockers and privacy browsers since it's a known third-party tracker
// domain; proxying through our own domain under /ingest makes them look
// same-origin and mostly avoids that. See https://posthog.com/docs/advanced/proxy
const POSTHOG_INGEST_ORIGIN = 'https://eu.i.posthog.com';
const POSTHOG_ASSETS_ORIGIN = 'https://eu-assets.i.posthog.com';

function isMobileRequest(request: Request): boolean {
    // Chromium client hint wins when present (also respects an explicit
    // "Request Desktop Site" toggle). Safari/Firefox fall back to UA text.
    const chMobile = request.headers.get('sec-ch-ua-mobile');
    if (chMobile === '?1') return true;
    if (chMobile === '?0') return false;

    const ua = request.headers.get('user-agent') ?? '';
    return MOBILE_UA_REGEX.test(ua);
}

function posthogProxyTarget(url: URL): URL | null {
    if (url.pathname.startsWith('/ingest/static/')) {
        return new URL(
            url.pathname.replace('/ingest/static/', '/static/') + url.search,
            POSTHOG_ASSETS_ORIGIN
        );
    }
    if (url.pathname.startsWith('/ingest/')) {
        return new URL(
            url.pathname.replace('/ingest', '') + url.search,
            POSTHOG_INGEST_ORIGIN
        );
    }
    return null;
}

export default function middleware(request: Request) {
    const url = new URL(request.url);

    // Analytics proxy takes priority: applies to every visitor regardless
    // of device, so PostHog keeps working whether they land on the 3D
    // shell or get proxied to the OS view below.
    const posthogTarget = posthogProxyTarget(url);
    if (posthogTarget) {
        return rewrite(posthogTarget);
    }

    if (!isMobileRequest(request)) {
        return next({ headers: { Vary: 'User-Agent' } });
    }

    const target = new URL(url.pathname + url.search, INNER_SITE_ORIGIN);

    return rewrite(target, { headers: { Vary: 'User-Agent' } });
}
