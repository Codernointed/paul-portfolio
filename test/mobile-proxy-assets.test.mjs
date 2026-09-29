// Permanent regression test for a real production bug: mobile visitors got
// a blank white page because their proxied OS page's own JS/CSS 404ed - the
// edge middleware's matcher excluded those paths by extension the same way
// it excludes the shell's own binary assets, so Vercel's static layer 404ed
// them directly and routeRequest never got a chance to proxy them to
// codernointed-os.vercel.app.
//
// test/endpoints.test.mjs's createPreviewServer usage stubs 'proxy' actions
// (a fast, sufficient check that the *decision* was correct), which is
// exactly what let this bug ship undetected: the initial page fetch looked
// right, but nothing ever verified that the *referenced assets* of that
// proxied page also resolve. This test drives two real preview-server.mjs
// instances - one simulating codernointed-os.vercel.app, one simulating
// paulbotchwey.com with real (not stubbed) proxying to the first - against
// a small synthetic OS build (not the full CRA build, so this test doesn't
// depend on portfolio-inner-site having been built) shaped like the real
// one: an index.html referencing /static/js/*.js, /static/css/*.css and
// /favicon.ico, none of which exist in the shell's own public output.

import assert from 'node:assert/strict';
import test, { after, before } from 'node:test';
import { mkdtemp, readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generate } from '../scripts/generate-agent-files.mjs';
import { createPreviewServer } from '../scripts/preview-server.mjs';

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = await readFile(join(TEST_DIR, 'fixtures/index-template.html'), 'utf8');

const MOBILE = {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'user-agent':
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
};

let innerServer;
let innerBase;
let shellServer;
let shellBase;

before(async () => {
    // A minimal fixture shaped like the real CRA build: index.html
    // referencing hashed asset paths under /static/, plus a root favicon -
    // exactly the paths the real bug 404ed.
    const innerDir = await mkdtemp(join(tmpdir(), 'inner-fixture-'));
    await mkdir(join(innerDir, 'static/js'), { recursive: true });
    await mkdir(join(innerDir, 'static/css'), { recursive: true });
    await writeFile(
        join(innerDir, 'index.html'),
        '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
            '<link rel="icon" href="/favicon.ico">' +
            '<link href="/static/css/main.abc123.css" rel="stylesheet">' +
            '</head><body><div id="root"></div>' +
            '<script src="/static/js/main.abc123.js"></script></body></html>',
        'utf8'
    );
    await writeFile(join(innerDir, 'static/js/main.abc123.js'), 'console.log("os app");', 'utf8');
    await writeFile(join(innerDir, 'static/css/main.abc123.css'), 'body{margin:0}', 'utf8');
    await writeFile(join(innerDir, 'favicon.ico'), 'not-a-real-icon', 'utf8');

    innerServer = createPreviewServer({ rootDir: innerDir, host: 'codernointed-os.vercel.app' });
    await new Promise((resolvePromise) => innerServer.listen(0, '127.0.0.1', resolvePromise));
    innerBase = `http://127.0.0.1:${innerServer.address().port}`;

    const shellDir = await mkdtemp(join(tmpdir(), 'shell-fixture-'));
    await writeFile(join(shellDir, 'index.html'), TEMPLATE, 'utf8');
    await generate({ outDir: shellDir, templateHtml: TEMPLATE });

    shellServer = createPreviewServer({ rootDir: shellDir, realProxyTo: innerBase });
    await new Promise((resolvePromise) => shellServer.listen(0, '127.0.0.1', resolvePromise));
    shellBase = `http://127.0.0.1:${shellServer.address().port}`;
});

after(() => {
    innerServer?.close();
    shellServer?.close();
});

test('a mobile visitor\'s proxied OS page loads with its referenced assets, not a blank page', async () => {
    const pageRes = await fetch(`${shellBase}/`, { headers: MOBILE });
    assert.equal(pageRes.status, 200);
    const html = await pageRes.text();

    const assetPaths = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
        .map((m) => m[1])
        .filter((path) => path.startsWith('/static/') || path === '/favicon.ico');
    assert.ok(assetPaths.length >= 3, `expected to find the OS's asset references, got ${JSON.stringify(assetPaths)}`);

    for (const assetPath of assetPaths) {
        const assetRes = await fetch(`${shellBase}${assetPath}`, { headers: MOBILE });
        assert.equal(
            assetRes.status,
            200,
            `${assetPath} (referenced by the proxied mobile page) must resolve, not 404`
        );
    }
});

test('the same asset paths 404 for a desktop visitor (they belong to the OS, not the shell)', async () => {
    const desktopUA = { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/124.0 Safari/537.36' };
    const res = await fetch(`${shellBase}/static/js/main.abc123.js`, { headers: desktopUA });
    assert.equal(res.status, 404);
});
