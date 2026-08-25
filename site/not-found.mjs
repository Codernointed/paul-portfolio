// Bodies for real HTTP 404 responses. Both variants are built here so the
// edge middleware (which answers dynamically) and the build-time generator
// (which writes /404.html for static misses) never drift apart.

import { ROUTES, SITE, absoluteUrl } from './site-meta.mjs';

const MAX_ECHOED_PATH = 120;

/** Requested paths are echoed back, so they must be neutralised first. */
function safePath(pathname) {
    const path = String(pathname || '/').slice(0, MAX_ECHOED_PATH);
    return path.replace(/[^\w\-./~%:@&=+$,?#[\]!*'()]/g, '');
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Short markdown body: what failed, and where an agent should look instead. */
export function notFoundMarkdown(pathname) {
    const path = safePath(pathname);
    return [
        '# 404 - Page not found',
        '',
        `\`${path}\` does not exist on ${SITE.url}. No content is served at this path.`,
        '',
        '## Where to look instead',
        '',
        `- Sitemap: ${absoluteUrl('/sitemap.xml')}`,
        `- Agent index (llms.txt): ${absoluteUrl('/llms.txt')}`,
        `- Every page as one markdown file: ${absoluteUrl('/llms-full.txt')}`,
        `- Home: ${SITE.url}/`,
        '',
        '## All pages',
        '',
        ...ROUTES.map(
            (route) => `- [${route.title}](${absoluteUrl(route.path)})`
        ),
        '',
        `Any page above is also available as markdown - append \`.md\` to the path, or send \`Accept: text/markdown\`. Contact: ${SITE.email}`,
        '',
    ].join('\n');
}

/** HTML body for the same 404, for clients that asked for text/html. */
export function notFoundHtml(pathname) {
    const path = escapeHtml(safePath(pathname));
    const links = ROUTES.map(
        (route) =>
            `<li><a href="${route.path}">${escapeHtml(route.title)}</a></li>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 - Page not found | ${escapeHtml(SITE.name)}</title>
<meta name="robots" content="noindex, follow">
<meta name="description" content="This path does not exist on ${escapeHtml(SITE.url)}. Use the sitemap, llms.txt or the page list to find the right URL.">
<link rel="canonical" href="${SITE.url}/404.html">
<style>
body{margin:0;padding:48px 20px;background:#fff;color:#111;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
main{max-width:44rem;margin:0 auto}
h1{font-size:1.6rem;margin:0 0 .5rem}
h2{font-size:1.05rem;margin:2rem 0 .5rem}
code{background:#f1f1f1;padding:.1em .35em;border-radius:3px}
a{color:#00007b}
ul{padding-left:1.2rem}
</style>
</head>
<body>
<main>
<h1>404 - Page not found</h1>
<p><code>${path}</code> does not exist on ${escapeHtml(SITE.url)}. No content is served at this path.</p>
<h2>Where to look instead</h2>
<ul>
<li><a href="/sitemap.xml">Sitemap</a></li>
<li><a href="/llms.txt">Agent index (llms.txt)</a></li>
<li><a href="/llms-full.txt">Every page as one markdown file</a></li>
<li><a href="/">Home</a></li>
</ul>
<h2>All pages</h2>
<ul>${links}</ul>
<p>Any page above is also available as markdown - append <code>.md</code> to the path, or send <code>Accept: text/markdown</code>.</p>
</main>
</body>
</html>
`;
}
