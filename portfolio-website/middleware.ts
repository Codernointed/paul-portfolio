import { next, rewrite } from '@vercel/functions';

// Full catch-all: both the initial document and every asset request
// (from whichever app ends up being served) must pass through here.
export const config = {
    matcher: '/:path*',
};

const MOBILE_UA_REGEX =
    /Android|iPhone|iPod|iPad|IEMobile|BlackBerry|Opera Mini|webOS|Windows Phone|Mobile/i;

const INNER_SITE_ORIGIN = 'https://codernointed-os.vercel.app';

function isMobileRequest(request: Request): boolean {
    // Chromium client hint wins when present (also respects an explicit
    // "Request Desktop Site" toggle). Safari/Firefox fall back to UA text.
    const chMobile = request.headers.get('sec-ch-ua-mobile');
    if (chMobile === '?1') return true;
    if (chMobile === '?0') return false;

    const ua = request.headers.get('user-agent') ?? '';
    return MOBILE_UA_REGEX.test(ua);
}

export default function middleware(request: Request) {
    if (!isMobileRequest(request)) {
        return next({ headers: { Vary: 'User-Agent' } });
    }

    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, INNER_SITE_ORIGIN);

    return rewrite(target, { headers: { Vary: 'User-Agent' } });
}
