// Tiny renderer that turns the structured page blocks in ./page-content.mjs
// into either HTML (for the crawler-visible <main> block) or markdown (for
// the .md alternates served through Accept negotiation).
//
// Blocks are deliberately dumb: { h2 }, { h3 }, { p }, { ul }. Inline text may
// use two markdown constructs only - [label](url) and **bold** - so that one
// authored string renders correctly in both output formats.

import { SITE, canonicalUrl, absoluteUrl } from './site-meta.mjs';

const INLINE_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const INLINE_BOLD = /\*\*([^*]+)\*\*/g;

export function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Renders the inline markdown subset to HTML. */
export function inlineToHtml(text) {
    return escapeHtml(text)
        .replace(INLINE_LINK, (_match, label, href) => {
            const external = /^https?:\/\//.test(href);
            const rel = external ? ' rel="noopener noreferrer"' : '';
            return `<a href="${href}"${rel}>${label}</a>`;
        })
        .replace(INLINE_BOLD, '<strong>$1</strong>');
}

/** Plain text (no markup) - used to measure real content length. */
export function inlineToText(text) {
    return String(text)
        .replace(INLINE_LINK, '$1')
        .replace(INLINE_BOLD, '$1');
}

export function blocksToHtml(blocks) {
    return blocks
        .map((block) => {
            if (block.h2) return `<h2>${inlineToHtml(block.h2)}</h2>`;
            if (block.h3) return `<h3>${inlineToHtml(block.h3)}</h3>`;
            if (block.p) return `<p>${inlineToHtml(block.p)}</p>`;
            if (block.ul) {
                const items = block.ul
                    .map((item) => `<li>${inlineToHtml(item)}</li>`)
                    .join('');
                return `<ul>${items}</ul>`;
            }
            throw new Error(`Unknown block: ${JSON.stringify(block)}`);
        })
        .join('');
}

export function blocksToMarkdown(blocks) {
    return blocks
        .map((block) => {
            if (block.h2) return `## ${block.h2}`;
            if (block.h3) return `### ${block.h3}`;
            if (block.p) return block.p;
            if (block.ul) return block.ul.map((item) => `- ${item}`).join('\n');
            throw new Error(`Unknown block: ${JSON.stringify(block)}`);
        })
        .join('\n\n');
}

export function blocksToText(blocks) {
    return blocks
        .map((block) => {
            const value =
                block.h2 ?? block.h3 ?? block.p ?? (block.ul || []).join(' ');
            return inlineToText(value);
        })
        .join(' ');
}

/**
 * The crawler-visible content block injected into every shell page. It is
 * visually hidden (screen-reader technique, not display:none) so the 3D scene
 * looks exactly as before, and is revealed by the <noscript> stylesheet in
 * index.html when JavaScript is unavailable.
 */
export function contentBlockHtml(page) {
    return (
        `<main id="agent-content" class="agent-content">` +
        `<h1>${inlineToHtml(page.h1)}</h1>` +
        `<p>${inlineToHtml(page.summary)}</p>` +
        blocksToHtml(page.blocks) +
        `<nav aria-label="Site"><h2>Pages</h2><ul>` +
        page.links
            .map(
                (link) =>
                    `<li><a href="${link.href}">${escapeHtml(link.label)}</a></li>`
            )
            .join('') +
        `</ul></nav>` +
        `<p>Machine-readable copies of this page: ` +
        `<a href="${page.route.markdown}">markdown</a>, ` +
        `<a href="/llms.txt">llms.txt</a>, ` +
        `<a href="/sitemap.xml">sitemap.xml</a>.</p>` +
        `</main>`
    );
}

/** A complete markdown document for one page. */
export function pageMarkdown(page) {
    const lines = [
        `# ${page.h1}`,
        '',
        `> ${page.summary}`,
        '',
        blocksToMarkdown(page.blocks),
        '',
        '## Pages',
        '',
        ...page.links.map(
            (link) => `- [${link.label}](${absoluteUrl(link.href)})`
        ),
        '',
        '---',
        '',
        `Canonical URL: ${canonicalUrl(page.route)}`,
        `Contact: ${SITE.email}`,
        `Agent index: ${absoluteUrl('/llms.txt')} · Sitemap: ${absoluteUrl('/sitemap.xml')}`,
        `Last updated: ${SITE.updated}`,
        '',
    ];
    return lines.join('\n');
}

/**
 * JSON-LD identity graph. Person is the primary entity (personal site);
 * Organization carries the contactPoint + PostalAddress that agents use to
 * verify a real, reachable business.
 */
export function jsonLd(page) {
    const address = {
        '@type': 'PostalAddress',
        addressLocality: SITE.locality,
        addressRegion: SITE.region,
        addressCountry: SITE.country,
    };

    const person = {
        '@type': 'Person',
        '@id': `${SITE.url}/#person`,
        name: SITE.name,
        alternateName: SITE.alternateName,
        url: `${SITE.url}/`,
        image: SITE.image,
        email: `mailto:${SITE.email}`,
        jobTitle: SITE.jobTitle,
        description: SITE.description,
        address,
        sameAs: SITE.sameAs,
        knowsAbout: [
            'Flutter',
            'Dart',
            'Mobile app development',
            'React',
            'Next.js',
            'TypeScript',
            'Python',
            'TensorFlow',
            'Machine learning',
            'Data science',
            'AWS',
        ],
        worksFor: { '@id': `${SITE.url}/#organization` },
    };

    const organization = {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.name,
        alternateName: SITE.alternateName,
        url: `${SITE.url}/`,
        logo: SITE.image,
        image: SITE.image,
        description: SITE.description,
        email: `mailto:${SITE.email}`,
        founder: { '@id': `${SITE.url}/#person` },
        address,
        areaServed: 'Worldwide',
        sameAs: SITE.sameAs,
        contactPoint: [
            {
                '@type': 'ContactPoint',
                contactType: 'sales',
                email: SITE.email,
                url: `${SITE.url}/contact`,
                availableLanguage: ['en'],
                areaServed: 'Worldwide',
            },
            {
                '@type': 'ContactPoint',
                contactType: 'technical support',
                email: SITE.email,
                url: `${SITE.url}/contact`,
                availableLanguage: ['en'],
                areaServed: 'Worldwide',
            },
        ],
    };

    const website = {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: `${SITE.url}/`,
        name: `${SITE.name} - Portfolio`,
        description: SITE.description,
        inLanguage: 'en',
        publisher: { '@id': `${SITE.url}/#organization` },
    };

    const webPage = {
        '@type': 'WebPage',
        '@id': `${canonicalUrl(page.route)}#webpage`,
        url: canonicalUrl(page.route),
        name: page.route.title,
        description: page.route.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE.url}/#website` },
        about: { '@id': `${SITE.url}/#person` },
        dateModified: SITE.updated,
        primaryImageOfPage: SITE.image,
        encoding: {
            '@type': 'MediaObject',
            encodingFormat: 'text/markdown',
            contentUrl: absoluteUrl(page.route.markdown),
        },
    };

    return {
        '@context': 'https://schema.org',
        '@graph': [person, organization, website, webPage],
    };
}
