// The Vercel matcher itself runs outside our code (it's evaluated by the
// platform before middleware.ts is ever invoked), so it can't be exercised
// through routeRequest. This test instead compiles the exact same pattern
// middleware.ts builds and checks it against real paths pulled from both
// deployments' build output, so a typo in the extension list or the regex
// shape fails a test instead of silently under- or over-matching in
// production.

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MIDDLEWARE_SKIPPED_EXTENSIONS, OS_MATCHED_EXACT_PATHS, OS_MATCHED_PREFIXES, isMatcherIncluded } from '../site/request-router.mjs';
import { ROUTES, AGENT_FILES } from '../site/site-meta.mjs';

const MIDDLEWARE_SOURCE = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../middleware.ts'),
    'utf8'
);

// isMatcherIncluded is the single source of truth (see its own comment in
// site/request-router.mjs); middleware.ts's own matcher has to be a
// hand-written literal instead (Vercel requires that), so the tests below
// cross-check the two instead of importing one into the other.
const isMatched = isMatcherIncluded;

test('every page route and agent file stays matched', () => {
    for (const route of ROUTES) {
        assert.ok(isMatched(route.path), `${route.path} should be matched`);
        assert.ok(isMatched(route.file), `${route.file} should be matched`);
        assert.ok(isMatched(route.markdown), `${route.markdown} should be matched`);
    }
    for (const path of Object.values(AGENT_FILES)) {
        assert.ok(isMatched(path), `${path} should be matched`);
    }
    assert.ok(isMatched('/'), 'root should be matched');
    assert.ok(isMatched('/some-path-that-does-not-exist'), 'unknown paths should be matched (for the 404)');
});

test('the PostHog ingest proxy stays matched regardless of its own extension', () => {
    assert.ok(isMatched('/ingest/e/'));
    assert.ok(isMatched('/ingest/static/array.js'), '.js under /ingest/ must still be proxied');
    assert.ok(isMatched('/ingest/static/recorder.js'));
});

test('every real shell-owned static asset extension is skipped', () => {
    const examples = [
        '/bundle.39c5ae57844f8641.js',
        '/main.css',
        '/main.css.map',
        '/bundle.abc.js.map',
        '/images/favicon.ico',
        '/images/preview.jpg',
        '/images/android-chrome-192x192.png',
        '/models/Computer/baked_computer.jpg',
        '/models/Computer/computer.glb',
        '/textures/environmentMap/nz.jpg',
        '/textures/monitor/video/base-static.mp4',
        '/textures/monitor/layers/png/dust.png',
        '/audio/atmosphere/office.mp3',
        '/audio/atmosphere/office.ogg',
        '/audio/computer/idle.wav',
        '/draco/draco_wasm_wrapper.js',
        '/draco/draco_decoder.wasm',
    ];
    for (const path of examples) {
        assert.ok(!isMatched(path), `${path} should be skipped (static layer serves it directly)`);
    }
});

// These are the 2D OS's own build output - the paths a mobile visitor's
// proxied page actually references for its JS bundle, CSS, js-dos game
// assets, favicon and manifest. Fixed a real production bug: because these
// were excluded the same way as the shell's own binary assets, the
// middleware never ran for them, Vercel's static layer 404ed them directly
// (this shell deployment has no /static/ or /js-dos/ directory at all), and
// mobile visitors got a blank white page instead of the OS.
test("the OS's own build output stays matched even though most of it has a skipped extension", () => {
    const examples = [
        '/static/js/main.84cdf68a.js',
        '/static/css/main.a3e1ea22.css',
        '/static/media/logo.abc123.svg',
        '/js-dos/wdosbox.wasm',
        '/js-dos/wdosbox.js.symbols',
        '/js-dos/js-dos.js',
        '/js-dos/js-dos.css',
        '/js-dos/types/src/dom.d.ts',
        '/favicon.ico',
        '/manifest.json',
        '/asset-manifest.json',
        '/diag.html',
        '/digger.jsdos',
        '/doom.jsdos',
        '/scrabble.jsdos',
        '/trail.jsdos',
    ];
    for (const path of examples) {
        assert.ok(isMatched(path), `${path} must stay matched so it can be proxied to the OS`);
    }
});

test('.md is the one extension that keeps going through the router', () => {
    assert.ok(isMatched('/about.md'));
    assert.ok(isMatched('/projects/mobile.md'));
    // The vendored draco README also matches - harmless (it already gets
    // forced to Content-Type: text/markdown today, which is correct for a
    // markdown file) and out of scope for this change.
    assert.ok(isMatched('/draco/README.md'));
});

test('.xml, .txt and .html stay matched (low traffic, no reason to special-case)', () => {
    assert.ok(isMatched('/sitemap.xml'));
    assert.ok(isMatched('/robots.txt'));
    assert.ok(isMatched('/llms.txt'));
    assert.ok(isMatched('/404.html'));
});

// Vercel statically parses config.matcher at build time, without executing
// any code - it must be a plain array of string literals. A computed value
// (a template literal interpolating an imported constant, a function call)
// breaks that static analysis and fails the build. This broke the
// codernointed-os production deploy once already: config.matcher's second
// entry was built from MIDDLEWARE_SKIPPED_EXTENSIONS via a template
// literal instead of being written out as a literal string.
test("middleware.ts's matcher is a hand-written literal, not a computed value", () => {
    const configBlock = MIDDLEWARE_SOURCE.match(
        /export const config = \{[\s\S]*?\n};/
    )?.[0];
    assert.ok(configBlock, "middleware.ts must export a literal `config` object");

    assert.ok(!configBlock.includes('${'), 'config.matcher must contain no template-literal interpolation');
    assert.ok(!configBlock.includes('.join('), 'config.matcher must not call .join() at runtime');
    assert.ok(!configBlock.includes('MIDDLEWARE_SKIPPED_EXTENSIONS'), 'config.matcher must not reference an imported constant');
});

test("middleware.ts's hand-written matcher literal stays in sync with MIDDLEWARE_SKIPPED_EXTENSIONS", () => {
    // MIDDLEWARE_SOURCE is raw, unparsed file text: a literal backslash in
    // the *string value* middleware.ts's matcher evaluates to is written as
    // two backslash characters in that source text (JS escaping). Building
    // the expected snippet with a plain template literal here would give a
    // parsed value (one backslash), not source text (two) - hence \\\\.
    const expectedPattern = `/((?!.*\\\\.(?:${MIDDLEWARE_SKIPPED_EXTENSIONS.join('|')})$).*)`;
    assert.ok(
        MIDDLEWARE_SOURCE.includes(`'${expectedPattern}'`),
        "middleware.ts's matcher literal must match MIDDLEWARE_SKIPPED_EXTENSIONS exactly - " +
            'update the hand-written string in middleware.ts when that list changes'
    );
});

// Guards the literal entries isMatcherIncluded assumes middleware.ts's
// matcher actually contains - a mismatch here means the two have drifted
// apart, since middleware.ts can't import OS_MATCHED_PREFIXES/
// OS_MATCHED_EXACT_PATHS directly (its matcher must be a static literal).
test("middleware.ts's matcher source actually contains the OS build-output entries", () => {
    for (const prefix of OS_MATCHED_PREFIXES) {
        const entry = `'${prefix}:path*'`;
        assert.ok(MIDDLEWARE_SOURCE.includes(entry), `middleware.ts's matcher must include ${entry}`);
    }
    for (const path of OS_MATCHED_EXACT_PATHS) {
        const entry = `'${path}'`;
        assert.ok(MIDDLEWARE_SOURCE.includes(entry), `middleware.ts's matcher must include ${entry}`);
    }
});
