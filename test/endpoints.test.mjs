// End-to-end check of the public surface: the real routing module in front of
// the real generated output, served the way Vercel serves it. This is the test
// that would have caught the soft-404 (every path answering 200 with the app
// shell) that the site used to have.

import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generate } from '../scripts/generate-agent-files.mjs';
import { createPreviewServer } from '../scripts/preview-server.mjs';
import { ROUTES, SITE } from '../site/site-meta.mjs';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = await readFile(join(TEST_DIR, 'fixtures/index-template.html'), 'utf8');

const BROWSER = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
};
const CURL = { accept: '*/*', 'user-agent': 'curl/8.4.0' };

let server;
let base;

before(async () => {
    const rootDir = await mkdtemp(join(tmpdir(), 'endpoints-'));
    await writeFile(join(rootDir, 'index.html'), TEMPLATE, 'utf8');
    await generate({ outDir: rootDir, templateHtml: TEMPLATE });
    // A hashed asset, so the static passthrough can be exercised too.
    await writeFile(join(rootDir, 'main.css'), 'body{margin:0}', 'utf8');

    server = createPreviewServer({ rootDir });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

const get = (path, headers = BROWSER) => fetch(`${base}${path}`, { headers });

test('a nonexistent path returns a real 404, not the app shell', async () => {
    const res = await get('/some-path-that-does-not-exist', CURL);
    assert.equal(res.status, 404);
    assert.match(res.headers.get('content-type'), /text\/markdown/);
    const body = await res.text();
    assert.match(body, /404 - Page not found/);
    assert.ok(body.includes(`${SITE.url}/sitemap.xml`));
    assert.ok(body.includes(`${SITE.url}/llms.txt`));
    assert.ok(!body.includes('id="webgl"'), 'never the app shell');
});

test('deep and file-like nonexistent paths also 404', async () => {
    for (const path of ['/nope', '/a/b/c', '/wp-login.php', '/assets/missing.js']) {
        const res = await get(path, CURL);
        assert.equal(res.status, 404, `${path} should 404`);
    }
});

test('every real route returns 200 HTML with content, an H1 and a canonical URL', async () => {
    for (const route of ROUTES) {
        const res = await get(route.path);
        assert.equal(res.status, 200, `${route.path} should be 200`);
        assert.match(res.headers.get('content-type'), /text\/html/);
        const html = await res.text();
        assert.match(html, /<h1>/, `${route.path} has an H1`);
        assert.ok(
            html.includes(`<link rel="canonical" href="${SITE.url}${route.path === '/' ? '/' : route.path}">`),
            `${route.path} canonical`
        );
        assert.match(html, /application\/ld\+json/, `${route.path} JSON-LD`);
    }
});

test('the homepage serves 500+ characters of text without running JavaScript', async () => {
    const html = await (await get('/')).text();
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    assert.ok(text.length >= 500, `homepage text is ${text.length} chars`);
    assert.match(text, /Paul Botchwey/);
});

test('Accept: text/markdown is honoured and advertised through Vary', async () => {
    for (const route of ROUTES) {
        const res = await get(route.path, { accept: 'text/markdown' });
        assert.equal(res.status, 200);
        assert.match(
            res.headers.get('content-type'),
            /text\/markdown/,
            `${route.path} returns markdown`
        );
        const vary = res.headers.get('vary');
        assert.match(vary, /\bAccept\b/, `${route.path} varies on Accept`);
        assert.match(vary, /Accept-Encoding/, `${route.path} varies on Accept-Encoding`);
        assert.match(
            res.headers.get('link'),
            /rel="alternate"; type="text\/markdown"/
        );
        const body = await res.text();
        assert.ok(!body.includes('<html'), 'markdown body, not HTML');
    }
});

test('browsers still get HTML, and that response varies on Accept too', async () => {
    const res = await get('/about');
    assert.match(res.headers.get('content-type'), /text\/html/);
    assert.match(res.headers.get('vary'), /\bAccept\b/);
});

test('the .md alternates are directly fetchable', async () => {
    const res = await get('/about.md', CURL);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/markdown/);
    assert.match(await res.text(), /^# About Paul Botchwey/);
});

test('sitemap.xml, robots.txt, llms.txt, llms-full.txt and agents.md are served', async () => {
    const sitemap = await get('/sitemap.xml', CURL);
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.headers.get('content-type'), /xml/);
    assert.match(await sitemap.text(), /<urlset/);

    const robots = await get('/robots.txt', CURL);
    assert.equal(robots.status, 200);
    assert.match(await robots.text(), /Sitemap: https:\/\/paulbotchwey\.com\/sitemap\.xml/);

    for (const path of ['/llms.txt', '/llms-full.txt', '/agents.md']) {
        const res = await get(path, CURL);
        assert.equal(res.status, 200, `${path} should be served`);
        assert.ok((await res.text()).length > 500);
    }
});

test('static assets are served untouched', async () => {
    const res = await get('/main.css', CURL);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /text\/css/);
});

test('mobile visitors are still proxied to the OS deployment', async () => {
    const res = await get('/', {
        ...BROWSER,
        'user-agent':
            'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    });
    assert.equal(
        res.headers.get('x-preview-proxy-to'),
        'https://codernointed-os.vercel.app/'
    );
});
