import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generate, renderShellPage } from '../scripts/generate-agent-files.mjs';
import { ROUTES, SITE, canonicalUrl } from '../site/site-meta.mjs';
import { PAGES } from '../site/page-content.mjs';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(TEST_DIR, '..');
const TEMPLATE = await readFile(join(TEST_DIR, 'fixtures/index-template.html'), 'utf8');

/** Rough "what a crawler reads" measure: strip scripts, styles and tags. */
function visibleText(html) {
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function generateToTempDir() {
    const outDir = await mkdtemp(join(tmpdir(), 'agent-files-'));
    await writeFile(join(outDir, 'index.html'), TEMPLATE, 'utf8');
    const written = await generate({ outDir, templateHtml: TEMPLATE });
    return { outDir, written };
}

const { outDir, written } = await generateToTempDir();
const read = (path) => readFile(join(outDir, path.replace(/^\//, '')), 'utf8');

test('every route produces an HTML page and a markdown twin', async () => {
    for (const route of ROUTES) {
        assert.ok(written.includes(route.file), `${route.file} written`);
        assert.ok(written.includes(route.markdown), `${route.markdown} written`);
    }
});

test('generated pages carry all four metadata signals', async () => {
    for (const route of ROUTES) {
        const html = await read(route.file);
        assert.match(html, /<html lang="en">/i, `${route.path} declares a language`);
        assert.ok(
            html.includes(`<link rel="canonical" href="${canonicalUrl(route)}">`),
            `${route.path} has a canonical URL`
        );
        assert.match(html, /<meta property="og:image" content="https:\/\/[^"]+">/, `${route.path} og:image`);
        assert.match(html, /<meta property="og:type" content="[^"]+">/, `${route.path} og:type`);
        assert.ok(
            html.includes(`<link rel="alternate" type="text/markdown" href="${route.markdown}">`),
            `${route.path} advertises its markdown twin`
        );
    }
});

test('titles, descriptions and Open Graph tags are per-page', async () => {
    const about = await read('/about.html');
    const route = ROUTES.find((candidate) => candidate.path === '/about');
    assert.ok(
        about.includes(`<title>${route.title.replace(/&/g, '&amp;')}</title>`),
        'the title is the route title, HTML-escaped'
    );
    assert.match(about, /<meta name="description" content="Who Paul Botchwey is/);
    assert.match(about, /<meta property="og:url" content="https:\/\/paulbotchwey\.com\/about">/);
    assert.match(about, /<meta property="og:title" content="About Paul Botchwey/);
});

test('every page has an H1 and 500+ characters of text without JavaScript', async () => {
    for (const route of ROUTES) {
        const html = await read(route.file);
        assert.match(html, /<h1>/, `${route.path} has an H1`);
        const text = visibleText(html);
        assert.ok(
            text.length >= 500,
            `${route.path} has ${text.length} chars of text, expected 500+`
        );
    }
});

test('trust anchor pages exist with real content', async () => {
    for (const path of ['/about', '/contact', '/privacy']) {
        const route = ROUTES.find((candidate) => candidate.path === path);
        assert.ok(route, `${path} is a route`);
        const text = visibleText(await read(route.file));
        assert.ok(text.length >= 500, `${path} has ${text.length} chars`);
        const markdown = await read(route.markdown);
        assert.ok(markdown.length >= 500, `${path}.md has ${markdown.length} chars`);
    }
});

test('the privacy page is a plain readable page, not the 3D shell', async () => {
    const html = await read('/privacy.html');
    assert.ok(!html.includes('id="webgl"'), 'no WebGL shell');
    assert.match(html, /Privacy Policy/);
    assert.match(html, /PostHog/);
    assert.match(html, new RegExp(SITE.email.replace('.', '\\.')));
});

test('JSON-LD is present, valid, and identifies Person plus Organization', async () => {
    for (const route of ROUTES) {
        const html = await read(route.file);
        const match = html.match(
            /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
        );
        assert.ok(match, `${route.path} has JSON-LD`);
        const data = JSON.parse(match[1]);
        assert.equal(data['@context'], 'https://schema.org');

        const nodes = data['@graph'];
        const byType = (type) => nodes.find((node) => node['@type'] === type);

        const person = byType('Person');
        assert.equal(person.name, SITE.name);
        assert.equal(person.url, `${SITE.url}/`);
        assert.ok(person.description.length > 0);
        assert.deepEqual(person.sameAs, SITE.sameAs);

        const org = byType('Organization');
        assert.ok(org, `${route.path} has Organization schema`);
        assert.ok(Array.isArray(org.contactPoint) && org.contactPoint.length > 0);
        for (const point of org.contactPoint) {
            assert.equal(point['@type'], 'ContactPoint');
            assert.ok(point.contactType, 'contactPoint has a contactType');
            assert.ok(point.email, 'contactPoint has an email');
        }
        assert.equal(org.address['@type'], 'PostalAddress');
        assert.equal(org.address.addressLocality, SITE.locality);
        assert.equal(org.address.addressCountry, SITE.country);

        assert.ok(byType('WebSite'));
        assert.equal(byType('WebPage').url, canonicalUrl(route));
    }
});

test('markdown twins are real markdown documents', async () => {
    for (const page of PAGES) {
        const markdown = await read(page.route.markdown);
        assert.ok(markdown.startsWith(`# ${page.h1}`), `${page.route.markdown} starts with its H1`);
        assert.match(markdown, /^> /m, 'has a summary blockquote');
        assert.ok(markdown.includes(canonicalUrl(page.route)), 'names its canonical URL');
        assert.ok(!/<[a-z]+[ >]/i.test(markdown), 'contains no raw HTML tags');
    }
});

test('sitemap.xml lists every route with a lastmod date', async () => {
    const xml = await read('/sitemap.xml');
    assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    assert.deepEqual(locs, ROUTES.map((route) => canonicalUrl(route)));
    const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
    assert.equal(lastmods.length, ROUTES.length);
    for (const lastmod of lastmods) {
        assert.match(lastmod, /^\d{4}-\d{2}-\d{2}$/);
        assert.ok(!Number.isNaN(Date.parse(lastmod)));
    }
    assert.ok(xml.length < 50 * 1024 * 1024);
});

test('robots.txt allows crawling and points at the sitemap and llms.txt', async () => {
    const robots = await read('/robots.txt');
    assert.match(robots, /^User-agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(robots, new RegExp(`^Sitemap: ${SITE.url}/sitemap\\.xml$`, 'm'));
    assert.ok(robots.includes('/llms.txt'));
});

test('llms.txt follows the llmstxt.org shape and says when to use the site', async () => {
    const llms = await read('/llms.txt');
    assert.ok(llms.startsWith(`# ${SITE.name}\n`), 'starts with an H1 name');
    assert.match(llms, /^> /m, 'has the summary blockquote');
    assert.match(llms, /^## When to use this site$/m);
    assert.match(llms, /^## How to call it$/m);
    assert.match(llms, /^## Pages$/m);

    const whenToUse = llms.split('## When to use this site')[1].split('\n##')[0];
    assert.ok(whenToUse.split('\n').filter((line) => line.startsWith('- ')).length >= 5);
    assert.match(whenToUse, /Flutter/);
    assert.match(whenToUse, /hire, commission or contact/);

    for (const route of ROUTES) {
        assert.ok(llms.includes(`${SITE.url}${route.markdown}`), `${route.markdown} listed`);
    }
});

test('llms-full.txt contains every page in one file', async () => {
    const full = await read('/llms-full.txt');
    for (const page of PAGES) {
        assert.ok(full.includes(`# ${page.h1}`), `${page.route.path} included`);
    }
    assert.ok(full.length > 5000);
});

test('agents.md gives when-to-use guidance and how to call the site', async () => {
    const agents = await read('/agents.md');
    assert.match(agents, /^## When to use this site$/m);
    assert.match(agents, /Accept: text\/markdown/);
    assert.match(agents, /HTTP 404/);
    assert.ok(agents.includes(SITE.email));
});

test('404.html is a real page pointing agents back at the index', async () => {
    const html = await read('/404.html');
    assert.match(html, /404 - Page not found/);
    assert.match(html, /<html lang="en">/);
    assert.ok(html.includes('/sitemap.xml'));
    assert.ok(html.includes('/llms.txt'));
});

test('relative webpack asset URLs are made absolute so nested pages still boot', async () => {
    const nested = await read('/projects/mobile.html');
    assert.match(nested, /src="\/bundle\.[a-f0-9]+\.js"/);
    assert.match(nested, /href="\/main\.css"/);
    assert.ok(!/src="bundle\./.test(nested), 'no relative bundle URL left');
});

test('re-running the generator over its own output changes nothing', async () => {
    const first = await read('/about.html');
    const regenerated = renderShellPage(
        await read('/index.html'),
        PAGES.find((page) => page.route.path === '/about')
    );
    assert.equal(regenerated, first);
});

test('the generator fails loudly when the template loses a required tag', () => {
    const broken = TEMPLATE.replace(/<link rel="canonical"[^>]*>/, '');
    assert.throws(
        () => renderShellPage(broken, PAGES[0]),
        /could not find <link rel="canonical">/
    );
});

test('the webpack template still has every tag the generator rewrites', async () => {
    const source = await readFile(
        join(REPO_ROOT, 'portfolio-website/src/index.html'),
        'utf8'
    );
    assert.match(source, /<title>[\s\S]*?<\/title>/);
    assert.match(source, /<meta name="description"/);
    assert.match(source, /<meta property="og:title"/);
    assert.match(source, /<meta property="og:description"/);
    assert.match(source, /<meta property="og:url"/);
    assert.match(source, /<meta property="og:image"/);
    assert.match(source, /<meta property="og:type"/);
    assert.match(source, /<link rel="canonical"/);
    assert.match(source, /<link rel="alternate" type="text\/markdown"/);
    assert.match(source, /\.agent-content\s*\{/);
    assert.match(source, /<noscript>/);
    assert.match(source, /<html lang="en">/);
});
