import assert from 'node:assert/strict';
import test from 'node:test';

import {
    INNER_SITE_ORIGIN,
    MARKDOWN_TYPE,
    VARY,
    acceptsHtml,
    isBotRequest,
    isMobileRequest,
    isStaticAssetPath,
    prefersMarkdown,
    routeRequest,
} from '../site/request-router.mjs';
import { ROUTES } from '../site/site-meta.mjs';

const SHELL = 'https://paulbotchwey.com';
const DESKTOP_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MOBILE_UA =
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const GOOGLEBOT_MOBILE_UA =
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BROWSER_ACCEPT =
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';

function get(path, headers = {}) {
    return routeRequest({
        url: `${SHELL}${path}`,
        headers: { host: 'paulbotchwey.com', ...headers },
    });
}

test('Accept negotiation only picks markdown when it is asked for explicitly', () => {
    assert.equal(prefersMarkdown('text/markdown'), true);
    assert.equal(prefersMarkdown('text/markdown, text/html;q=0.5'), true);
    assert.equal(prefersMarkdown('text/markdown;q=0.9, text/html;q=0.9'), true);
    assert.equal(prefersMarkdown('text/x-markdown'), true);

    assert.equal(prefersMarkdown(BROWSER_ACCEPT), false, 'browsers keep HTML');
    assert.equal(prefersMarkdown('*/*'), false, 'curl default keeps HTML');
    assert.equal(prefersMarkdown('text/markdown;q=0'), false);
    assert.equal(prefersMarkdown('text/html, text/markdown;q=0.5'), false);
    assert.equal(prefersMarkdown(''), false);
    assert.equal(prefersMarkdown(undefined), false);
});

test('acceptsHtml recognises browsers and not markdown-only agents', () => {
    assert.equal(acceptsHtml(BROWSER_ACCEPT), true);
    assert.equal(acceptsHtml('text/markdown'), false);
    assert.equal(acceptsHtml('*/*'), false);
});

test('static asset paths are handed to the static layer', () => {
    assert.equal(isStaticAssetPath('/bundle.abc123.js'), true);
    assert.equal(isStaticAssetPath('/models/Computer/baked.jpg'), true);
    assert.equal(isStaticAssetPath('/api/contact'), true);
    assert.equal(isStaticAssetPath('/.well-known/security.txt'), true);
    assert.equal(isStaticAssetPath('/about'), false);
    assert.equal(isStaticAssetPath('/projects/mobile'), false);
});

test('bot detection wins over mobile detection', () => {
    assert.equal(isMobileRequest({ 'user-agent': MOBILE_UA }), true);
    assert.equal(isMobileRequest({ 'user-agent': DESKTOP_UA }), false);
    assert.equal(isMobileRequest({ 'sec-ch-ua-mobile': '?0', 'user-agent': MOBILE_UA }), false);
    assert.equal(isMobileRequest({ 'sec-ch-ua-mobile': '?1', 'user-agent': DESKTOP_UA }), true);

    assert.equal(isBotRequest({ 'user-agent': GOOGLEBOT_MOBILE_UA }), true);
    assert.equal(isBotRequest({ 'user-agent': 'GPTBot/1.0' }), true);
    assert.equal(isBotRequest({ 'user-agent': 'curl/8.4.0' }), true);
    assert.equal(isBotRequest({ 'user-agent': MOBILE_UA }), false);
});

test('unknown paths get a real 404 with a markdown body', () => {
    const action = get('/some-path-that-does-not-exist', { 'user-agent': 'curl/8.4.0', accept: '*/*' });
    assert.equal(action.kind, 'response');
    assert.equal(action.status, 404);
    assert.equal(action.headers['Content-Type'], MARKDOWN_TYPE);
    assert.equal(action.headers.Vary, VARY);
    assert.match(action.body, /^# 404 - Page not found/);
    assert.match(action.body, /sitemap\.xml/);
    assert.match(action.body, /llms\.txt/);
});

test('the 404 body is HTML for browsers and never reflects markup', () => {
    const action = get('/nope"><script>alert(1)</script>', { accept: BROWSER_ACCEPT });
    assert.equal(action.status, 404);
    assert.equal(action.headers['Content-Type'], 'text/html; charset=utf-8');
    assert.ok(!action.body.includes('<script>alert(1)'), 'no reflected markup');
    assert.match(action.body, /404 - Page not found/);
});

test('known routes are rewritten to their generated page with negotiation headers', () => {
    const action = get('/about', { accept: BROWSER_ACCEPT, 'user-agent': DESKTOP_UA });
    assert.equal(action.kind, 'rewrite');
    assert.equal(action.path, '/about.html');
    assert.equal(action.headers.Vary, VARY);
    assert.equal(action.headers.Link, '</about.md>; rel="alternate"; type="text/markdown"');
});

test('every route resolves, including nested project pages and the trailing slash form', () => {
    for (const route of ROUTES) {
        const action = get(route.path, { accept: BROWSER_ACCEPT, 'user-agent': DESKTOP_UA });
        assert.equal(action.kind, 'rewrite', `${route.path} should resolve`);
        assert.equal(action.path, route.file);
    }
    assert.equal(get('/about/', { 'user-agent': DESKTOP_UA }).path, '/about.html');
    assert.equal(get('/About', { 'user-agent': DESKTOP_UA }).path, '/about.html');
});

test('query strings survive the rewrite', () => {
    const action = get('/?debug=1', { 'user-agent': DESKTOP_UA });
    assert.equal(action.path, '/index.html?debug=1');
});

test('Accept: text/markdown serves the markdown twin with Vary: Accept', () => {
    const action = get('/about', { accept: 'text/markdown', 'user-agent': DESKTOP_UA });
    assert.equal(action.kind, 'rewrite');
    assert.equal(action.path, '/about.md');
    assert.equal(action.headers['Content-Type'], MARKDOWN_TYPE);
    assert.match(action.headers.Vary, /\bAccept\b/);
    assert.match(action.headers.Vary, /Accept-Encoding/);
});

test('markdown negotiation beats the mobile proxy so agents never get the noindex OS', () => {
    const action = get('/about', { accept: 'text/markdown', 'user-agent': MOBILE_UA });
    assert.equal(action.kind, 'rewrite');
    assert.equal(action.path, '/about.md');
});

test('.md files are served with the markdown content type', () => {
    const action = get('/about.md', { accept: '*/*' });
    assert.equal(action.kind, 'next');
    assert.equal(action.headers['Content-Type'], MARKDOWN_TYPE);
    assert.equal(action.headers.Vary, VARY);
});

test('mobile humans still get proxied to the OS deployment', () => {
    const action = get('/about', { accept: BROWSER_ACCEPT, 'user-agent': MOBILE_UA });
    assert.equal(action.kind, 'proxy');
    assert.equal(action.url, `${INNER_SITE_ORIGIN}/about`);
    assert.equal(action.headers.Vary, VARY);
});

test('crawlers with a mobile user agent get the shell HTML, not the OS proxy', () => {
    const action = get('/', { accept: BROWSER_ACCEPT, 'user-agent': GOOGLEBOT_MOBILE_UA });
    assert.equal(action.kind, 'rewrite');
    assert.equal(action.path, '/index.html');
});

test('standalone pages are never proxied to the OS deployment', () => {
    const action = get('/privacy', { accept: BROWSER_ACCEPT, 'user-agent': MOBILE_UA });
    assert.equal(action.kind, 'rewrite');
    assert.equal(action.path, '/privacy.html');
});

test('the PostHog ingest proxy is untouched', () => {
    const ingest = get('/ingest/e/?ip=1');
    assert.equal(ingest.kind, 'proxy');
    assert.equal(ingest.url, 'https://eu.i.posthog.com/e/?ip=1');

    const assets = get('/ingest/static/array.js');
    assert.equal(assets.kind, 'proxy');
    assert.equal(assets.url, 'https://eu-assets.i.posthog.com/static/array.js');
});

test('the OS deployment keeps SPA routing on its own host', () => {
    const action = routeRequest({
        url: 'https://codernointed-os.vercel.app/projects/mobile',
        headers: { host: 'codernointed-os.vercel.app', 'user-agent': MOBILE_UA },
    });
    assert.equal(action.kind, 'rewrite');
    assert.equal(action.path, '/index.html');

    const missing = routeRequest({
        url: 'https://codernointed-os.vercel.app/nope',
        headers: { host: 'codernointed-os.vercel.app', 'user-agent': MOBILE_UA },
    });
    assert.equal(missing.kind, 'response');
    assert.equal(missing.status, 404);
});

test('Headers objects are accepted as well as plain objects', () => {
    const action = routeRequest({
        url: `${SHELL}/about`,
        headers: new Headers({ host: 'paulbotchwey.com', accept: 'text/markdown' }),
    });
    assert.equal(action.path, '/about.md');
});
