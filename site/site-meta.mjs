// Single source of truth for everything machine-readable about the public
// site: identity, routes, and the files each route maps to.
//
// This module is imported by BOTH the edge middleware (which only needs the
// route table) and the build-time generator (which also pulls in
// ./page-content.mjs). Keep it dependency-free and side-effect-free so it can
// be bundled into the edge runtime.

export const SITE = {
    name: 'Paul Botchwey',
    alternateName: 'Codernointed',
    url: 'https://paulbotchwey.com',
    jobTitle: 'Mobile App Developer, Data Scientist & ML Engineer',
    description:
        "Paul Botchwey (Codernointed) is a Mobile App Developer, Data Scientist & ML Engineer based in Accra, Ghana, building Flutter apps, React and Next.js web platforms, and machine-learning systems.",
    email: 'botchweypaul0001@gmail.com',
    image: 'https://paulbotchwey.com/images/preview.jpg',
    locality: 'Accra',
    region: 'Greater Accra',
    country: 'GH',
    countryName: 'Ghana',
    sameAs: [
        'https://github.com/Codernointed',
        'https://www.linkedin.com/in/paulbotchwey/',
    ],
    // Bumped by hand when page copy changes; keeps <lastmod> deterministic
    // instead of churning on every deploy.
    updated: '2026-08-25',
};

/**
 * @typedef {object} SiteRoute
 * @property {string} path        Clean, canonical URL path.
 * @property {string} file        Static HTML file the path is rewritten to.
 * @property {string} markdown    Static markdown alternate for the path.
 * @property {string} title       <title> / markdown H1.
 * @property {string} description Meta description / markdown summary.
 * @property {'os'|'standalone'} kind
 *   'os'         - the interactive portfolio (3D shell on desktop, the OS on
 *                  mobile). Mobile visitors are proxied to the OS deployment.
 *   'standalone' - a plain readable page served to everyone as-is.
 * @property {number} priority    <priority> in sitemap.xml.
 */

/** @type {SiteRoute[]} */
export const ROUTES = [
    {
        path: '/',
        file: '/index.html',
        markdown: '/index.md',
        title: 'Paul Botchwey - Mobile App Developer, Data Scientist & ML Engineer',
        description:
            "I'm Paul Botchwey (Codernointed), a Mobile App Developer, Data Scientist & ML Engineer based in Accra, Ghana. Explore my interactive portfolio.",
        kind: 'os',
        priority: 1.0,
    },
    {
        path: '/about',
        file: '/about.html',
        markdown: '/about.md',
        title: 'About Paul Botchwey - Mobile, Data Science & ML Engineer in Accra',
        description:
            'Who Paul Botchwey is, what he builds with Flutter, React, Next.js, Python and TensorFlow, and how to get in touch.',
        kind: 'os',
        priority: 0.9,
    },
    {
        path: '/experience',
        file: '/experience.html',
        markdown: '/experience.md',
        title: 'Experience - Paul Botchwey',
        description:
            'Paul Botchwey’s engineering experience: Orctatech, Bookmie, HushSense, and independent data-science and machine-learning work.',
        kind: 'os',
        priority: 0.8,
    },
    {
        path: '/projects',
        file: '/projects.html',
        markdown: '/projects.md',
        title: 'Projects - Paul Botchwey',
        description:
            'Mobile apps on the Play Store, live web platforms, and machine-learning projects built by Paul Botchwey.',
        kind: 'os',
        priority: 0.8,
    },
    {
        path: '/projects/mobile',
        file: '/projects/mobile.html',
        markdown: '/projects/mobile.md',
        title: 'Mobile Development Projects - Paul Botchwey',
        description:
            'Flutter and Dart applications shipped by Paul Botchwey, including Somayen Delivery, Utim8, Outfit Matcher, AI Lecturer and U-Clinic.',
        kind: 'os',
        priority: 0.7,
    },
    {
        path: '/projects/web',
        file: '/projects/web.html',
        markdown: '/projects/web.md',
        title: 'Web Development Projects - Paul Botchwey',
        description:
            'Live React, Next.js and TypeScript platforms built by Paul Botchwey: Nabi Fashion, AceTours, Voyage Diaries, Cornel Media and Losung Optimum.',
        kind: 'os',
        priority: 0.7,
    },
    {
        path: '/projects/data',
        file: '/projects/data.html',
        markdown: '/projects/data.md',
        title: 'Data Science & Machine Learning Projects - Paul Botchwey',
        description:
            'Machine-learning work by Paul Botchwey: Vision Infinity eye-disease detection, sound-based anomaly detection, British Airways analytics and HushSense.',
        kind: 'os',
        priority: 0.7,
    },
    {
        path: '/contact',
        file: '/contact.html',
        markdown: '/contact.md',
        title: 'Contact Paul Botchwey',
        description:
            'How to reach Paul Botchwey for freelance mobile, web and machine-learning work: email, contact form, GitHub and LinkedIn.',
        kind: 'os',
        priority: 0.9,
    },
    {
        path: '/privacy',
        file: '/privacy.html',
        markdown: '/privacy.md',
        title: 'Privacy Policy - Paul Botchwey',
        description:
            'What paulbotchwey.com collects, which analytics and email services it uses, how contact-form messages are handled, and how to request deletion.',
        kind: 'standalone',
        priority: 0.4,
    },
];

/** Extra machine-readable files published at the site root. */
export const AGENT_FILES = {
    sitemap: '/sitemap.xml',
    robots: '/robots.txt',
    llms: '/llms.txt',
    llmsFull: '/llms-full.txt',
    agents: '/agents.md',
    notFound: '/404.html',
};

const ROUTES_BY_PATH = new Map(ROUTES.map((route) => [route.path, route]));
const ROUTES_BY_MARKDOWN = new Map(ROUTES.map((route) => [route.markdown, route]));

/** Normalizes `/about/` and `/ABOUT` style paths to a canonical route path. */
export function normalizePath(pathname) {
    if (!pathname) return '/';
    let path = pathname.toLowerCase();
    if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '');
    return path === '' ? '/' : path;
}

/** @returns {SiteRoute|undefined} */
export function routeForPath(pathname) {
    return ROUTES_BY_PATH.get(normalizePath(pathname));
}

/** @returns {SiteRoute|undefined} the route a `.md` alternate belongs to. */
export function routeForMarkdownPath(pathname) {
    return ROUTES_BY_MARKDOWN.get(normalizePath(pathname));
}

export function absoluteUrl(pathOrUrl) {
    if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
    return SITE.url + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

/** Canonical URL for a route: the apex domain with no trailing slash. */
export function canonicalUrl(route) {
    return route.path === '/' ? `${SITE.url}/` : `${SITE.url}${route.path}`;
}
