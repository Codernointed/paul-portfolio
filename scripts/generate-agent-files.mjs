#!/usr/bin/env node
// Post-build step for the 3D shell (the paulbotchwey.com deployment).
//
// webpack emits a single index.html. This script turns that one file into the
// full public surface an agent expects:
//
//   *.html        one page per route, each with its own title, description,
//                 canonical URL, Open Graph tags, JSON-LD and a readable
//                 (crawler-visible, visually hidden) content block
//   *.md          markdown alternates, served by Accept negotiation
//   llms.txt      agent index, including "when to use this site"
//   llms-full.txt every page as one markdown file
//   agents.md     longer agent instructions
//   sitemap.xml   every indexable URL with lastmod
//   robots.txt    allow-all plus the sitemap and llms.txt pointers
//   404.html      body served for static misses (the middleware answers the
//                 dynamic ones)
//
// Run automatically by `npm run build` in portfolio-website.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AGENT_FILES, ROUTES, SITE, absoluteUrl, canonicalUrl } from '../site/site-meta.mjs';
import { PAGES } from '../site/page-content.mjs';
import {
    blocksToHtml,
    contentBlockHtml,
    escapeHtml,
    inlineToHtml,
    jsonLd,
    pageMarkdown,
} from '../site/render.mjs';
import { notFoundHtml } from '../site/not-found.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT_DIR = resolve(SCRIPT_DIR, '../portfolio-website/public');

/** Replaces the first match of `pattern`, failing loudly when it is absent. */
function replaceOrThrow(html, pattern, replacement, what) {
    if (!pattern.test(html)) {
        throw new Error(
            `generate-agent-files: could not find ${what} in the built index.html. ` +
                `Update portfolio-website/src/index.html or this generator.`
        );
    }
    return html.replace(pattern, replacement);
}

function attrPattern(prefix, name) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(<meta ${prefix}="${escaped}" content=")[^"]*(")`, 'i');
}

function setMeta(html, prefix, name, value, { optional = false } = {}) {
    const pattern = attrPattern(prefix, name);
    if (optional && !pattern.test(html)) return html;
    return replaceOrThrow(
        html,
        pattern,
        `$1${escapeHtml(value)}$2`,
        `<meta ${prefix}="${name}">`
    );
}

/**
 * webpack emits relative asset URLs ("bundle.abc.js"). Those break as soon as
 * a page lives in a subdirectory (/projects/mobile.html), so every relative
 * src/href is made root-absolute.
 */
export function absolutizeAssetUrls(html) {
    return html.replace(
        /(\s(?:src|href)=")(?!https?:|\/\/|\/|#|data:|mailto:|tel:)([^"]+)(")/g,
        '$1/$2$3'
    );
}

function jsonLdScript(page) {
    // "</" inside a <script> would end the element early.
    const json = JSON.stringify(jsonLd(page), null, 2).replace(/<\//g, '<\\/');
    return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Strips anything a previous run injected, so re-running the generator over
 * its own output (without a fresh webpack build) is a no-op rather than a
 * duplication.
 */
export function stripGeneratedBlocks(html) {
    return html
        .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '')
        .replace(/<main id="agent-content"[\s\S]*?<\/main>/gi, '');
}

/** Builds one shell page (3D scene + hidden readable content) from the template. */
export function renderShellPage(templateHtml, page) {
    const canonical = canonicalUrl(page.route);
    let html = absolutizeAssetUrls(stripGeneratedBlocks(templateHtml));

    html = replaceOrThrow(
        html,
        /<title>[\s\S]*?<\/title>/i,
        `<title>${escapeHtml(page.route.title)}</title>`,
        '<title>'
    );
    html = setMeta(html, 'name', 'title', page.route.title, { optional: true });
    html = setMeta(html, 'name', 'description', page.route.description);
    html = setMeta(html, 'property', 'og:title', page.route.title);
    html = setMeta(html, 'property', 'og:description', page.route.description);
    html = setMeta(html, 'property', 'og:url', canonical);
    html = setMeta(html, 'property', 'twitter:title', page.route.title, { optional: true });
    html = setMeta(html, 'name', 'twitter:title', page.route.title, { optional: true });
    html = setMeta(html, 'property', 'twitter:description', page.route.description, { optional: true });
    html = setMeta(html, 'name', 'twitter:description', page.route.description, { optional: true });
    html = setMeta(html, 'property', 'twitter:url', canonical, { optional: true });
    html = setMeta(html, 'name', 'twitter:url', canonical, { optional: true });

    html = replaceOrThrow(
        html,
        /<link rel="canonical" href="[^"]*"\s*\/?>/i,
        `<link rel="canonical" href="${canonical}">`,
        '<link rel="canonical">'
    );
    html = replaceOrThrow(
        html,
        /<link rel="alternate" type="text\/markdown" href="[^"]*"\s*\/?>/i,
        `<link rel="alternate" type="text/markdown" href="${page.route.markdown}">`,
        '<link rel="alternate" type="text/markdown">'
    );

    html = replaceOrThrow(
        html,
        /<\/head>/i,
        `${jsonLdScript(page)}</head>`,
        '</head>'
    );
    html = replaceOrThrow(
        html,
        /<\/body>/i,
        `${contentBlockHtml(page)}</body>`,
        '</body>'
    );

    return html;
}

/** Builds a plain, fully visible page - used for the privacy policy. */
export function renderStandalonePage(page) {
    const canonical = canonicalUrl(page.route);
    const nav = page.links
        .map(
            (link) =>
                `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`
        )
        .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.route.title)}</title>
<meta name="description" content="${escapeHtml(page.route.description)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="text/markdown" href="${page.route.markdown}">
<meta property="og:type" content="article">
<meta property="og:url" content="${canonical}">
<meta property="og:title" content="${escapeHtml(page.route.title)}">
<meta property="og:description" content="${escapeHtml(page.route.description)}">
<meta property="og:image" content="${SITE.image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE.image}">
<link rel="shortcut icon" href="/images/favicon.ico" type="image/x-icon">
<style>
body{margin:0;padding:48px 20px;background:#fff;color:#111;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:44rem;margin:0 auto}
h1{font-size:1.7rem;margin:0 0 .5rem;line-height:1.25}
h2{font-size:1.1rem;margin:2rem 0 .5rem}
p,ul{margin:0 0 1rem}
ul{padding-left:1.2rem}
a{color:#00007b}
.lede{font-size:1.05rem}
footer{max-width:44rem;margin:3rem auto 0;padding-top:1rem;border-top:1px solid #ddd;font-size:.9rem}
</style>
${jsonLdScript(page)}
</head>
<body>
<main>
<h1>${inlineToHtml(page.h1)}</h1>
<p class="lede">${inlineToHtml(page.summary)}</p>
${blocksToHtml(page.blocks)}
</main>
<footer>
<nav aria-label="Site"><ul>${nav}</ul></nav>
<p>Machine-readable copy of this page: <a href="${page.route.markdown}">markdown</a>. Site index for agents: <a href="/llms.txt">llms.txt</a>, <a href="/sitemap.xml">sitemap.xml</a>.</p>
</footer>
</body>
</html>
`;
}

export function renderSitemap() {
    const urls = ROUTES.map((route) =>
        [
            '  <url>',
            `    <loc>${canonicalUrl(route)}</loc>`,
            `    <lastmod>${SITE.updated}</lastmod>`,
            '    <changefreq>monthly</changefreq>',
            `    <priority>${route.priority.toFixed(1)}</priority>`,
            '  </url>',
        ].join('\n')
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function renderRobots() {
    return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Agents: start with the index below. Every page also has a markdown twin -
# append .md to any path, or send "Accept: text/markdown".
#   ${absoluteUrl(AGENT_FILES.llms)}
#   ${absoluteUrl(AGENT_FILES.llmsFull)}
#   ${absoluteUrl(AGENT_FILES.agents)}

Sitemap: ${absoluteUrl(AGENT_FILES.sitemap)}
`;
}

const WHEN_TO_USE = [
    `Someone asks who **${SITE.name}** (GitHub handle **${SITE.alternateName}**) is, what he builds, or where he is based - the answer is on [/about](${absoluteUrl('/about.md')}).`,
    'Someone is looking for a **Flutter / Dart mobile developer** who has shipped to the Google Play Store - see [/projects/mobile](' +
        absoluteUrl('/projects/mobile.md') +
        ').',
    'Someone needs a **React / Next.js / TypeScript** web build, or wants proof of live client work - see [/projects/web](' +
        absoluteUrl('/projects/web.md') +
        ').',
    'Someone needs **machine learning, computer vision, audio anomaly detection or data analysis** in Python/TensorFlow - see [/projects/data](' +
        absoluteUrl('/projects/data.md') +
        ').',
    'Someone wants to **hire, commission or contact** him - the address, form and social profiles are on [/contact](' +
        absoluteUrl('/contact.md') +
        `). Direct email: ${SITE.email}.`,
    'Someone asks about **work history, roles or teams** (Orctatech, Bookmie, HushSense) - see [/experience](' +
        absoluteUrl('/experience.md') +
        ').',
    `Someone asks what this site collects or how to get data deleted - see [/privacy](${absoluteUrl('/privacy.md')}).`,
];

const NOT_FOR = [
    'This is one engineer’s portfolio, not an agency, a SaaS product or an API. There is no signup, no pricing page and no programmatic ordering.',
    'There is no public API to call. To start work, send email or the contact form; a human answers.',
    'Availability, rates and timelines are not published here - ask on the contact page.',
];

export function renderLlmsTxt() {
    const pageLinks = PAGES.map(
        (page) =>
            `- [${page.route.title}](${absoluteUrl(page.route.markdown)}): ${page.route.description}`
    ).join('\n');

    return `# ${SITE.name}

> ${SITE.description} Portfolio site at ${SITE.url}.

This file is the agent entry point for ${SITE.url}. Every page listed below is
available as HTML at its clean URL and as markdown at the .md URL shown here.
The site also answers \`Accept: text/markdown\` on any page URL and returns a
real HTTP 404 for paths that do not exist.

## When to use this site

${WHEN_TO_USE.map((item) => `- ${item}`).join('\n')}

## How to call it

- Fetch any page URL with \`Accept: text/markdown\` to get markdown, or append \`.md\` (\`${SITE.url}/about.md\`).
- Fetch [llms-full.txt](${absoluteUrl(AGENT_FILES.llmsFull)}) once to get every page in a single request.
- Structured identity (schema.org Person, Organization, WebSite) is embedded as JSON-LD in every HTML page.
- Contact is human, by email: ${SITE.email}. Include the platform, scope and timeline in the first message.

## Pages

${pageLinks}

## What this site is not

${NOT_FOR.map((item) => `- ${item}`).join('\n')}

## Optional

- [Sitemap](${absoluteUrl(AGENT_FILES.sitemap)}): every indexable URL with a lastmod date.
- [Agent instructions](${absoluteUrl(AGENT_FILES.agents)}): the same guidance in long form.
- [GitHub @${SITE.alternateName}](${SITE.sameAs[0]}): 90+ public repositories.
- [LinkedIn](${SITE.sameAs[1]}): professional profile.
`;
}

export function renderLlmsFull() {
    const body = PAGES.map((page) => pageMarkdown(page)).join('\n\n');
    return `# ${SITE.name} - complete site content

> Every page of ${SITE.url} as markdown, generated ${SITE.updated}. Index: ${absoluteUrl(AGENT_FILES.llms)}

${body}`;
}

export function renderAgentsMd() {
    return `# Agent instructions for ${SITE.url}

> ${SITE.description}

## When to use this site

${WHEN_TO_USE.map((item) => `- ${item}`).join('\n')}

## Identity

- Name: ${SITE.name} (also known as ${SITE.alternateName})
- Role: ${SITE.jobTitle}
- Location: ${SITE.locality}, ${SITE.region}, ${SITE.countryName}
- Email: ${SITE.email}
- Canonical domain: ${SITE.url}
- Profiles: ${SITE.sameAs.join(' , ')}

## How to read this site

- Clean URLs return HTML. The homepage and every page carry the full readable text in the raw HTML - no JavaScript execution is required.
- Sending \`Accept: text/markdown\` returns the markdown twin of the same page (\`Vary: Accept, Accept-Encoding, User-Agent\`). Appending \`.md\` to any path does the same without content negotiation.
- [llms.txt](${absoluteUrl(AGENT_FILES.llms)}) is the index; [llms-full.txt](${absoluteUrl(AGENT_FILES.llmsFull)}) is the whole site in one file.
- [sitemap.xml](${absoluteUrl(AGENT_FILES.sitemap)}) lists every indexable URL with a lastmod date.
- Unknown paths return HTTP 404 with a short markdown body pointing back here. A 200 never means "this path exists" by accident.

## How to make contact

1. Read [${SITE.url}/contact](${absoluteUrl('/contact.md')}) for the current channels.
2. Email ${SITE.email}, or point the person at the contact form on that page.
3. Include: the platform (mobile, web, or model), a short problem statement, the timeline, and whether the scope is fixed or ongoing.

There is no API, no booking endpoint and no automated ordering - a human reads and replies, usually within a couple of working days.

## What this site is not

${NOT_FOR.map((item) => `- ${item}`).join('\n')}

Last updated: ${SITE.updated}
`;
}

async function writeFileEnsured(outDir, relativePath, contents, written) {
    const target = join(outDir, relativePath.replace(/^\//, ''));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, 'utf8');
    written.push(relativePath);
}

/**
 * @param {{outDir?: string, templateHtml?: string}} [options]
 * @returns {Promise<string[]>} the site-relative paths written
 */
export async function generate(options = {}) {
    const outDir = options.outDir ?? DEFAULT_OUT_DIR;
    const templateHtml =
        options.templateHtml ??
        (await readFile(join(outDir, 'index.html'), 'utf8'));

    const written = [];

    for (const page of PAGES) {
        const html =
            page.route.kind === 'standalone'
                ? renderStandalonePage(page)
                : renderShellPage(templateHtml, page);
        await writeFileEnsured(outDir, page.route.file, html, written);
        await writeFileEnsured(
            outDir,
            page.route.markdown,
            pageMarkdown(page),
            written
        );
    }

    await writeFileEnsured(outDir, AGENT_FILES.sitemap, renderSitemap(), written);
    await writeFileEnsured(outDir, AGENT_FILES.robots, renderRobots(), written);
    await writeFileEnsured(outDir, AGENT_FILES.llms, renderLlmsTxt(), written);
    await writeFileEnsured(outDir, AGENT_FILES.llmsFull, renderLlmsFull(), written);
    await writeFileEnsured(outDir, AGENT_FILES.agents, renderAgentsMd(), written);
    await writeFileEnsured(
        outDir,
        AGENT_FILES.notFound,
        notFoundHtml('/404'),
        written
    );

    return written;
}

const invokedDirectly =
    process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
    const outArg = process.argv.indexOf('--out');
    const outDir = outArg === -1 ? DEFAULT_OUT_DIR : resolve(process.argv[outArg + 1]);
    const written = await generate({ outDir });
    console.log(
        `generate-agent-files: wrote ${written.length} files to ${outDir}\n  ` +
            written.join('\n  ')
    );
}
