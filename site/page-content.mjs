// The actual copy for every public route, authored once and rendered to both
// HTML (crawler-visible block inside the shell pages) and markdown (the .md
// alternates served via Accept negotiation, llms.txt and llms-full.txt).
//
// The wording mirrors what the interactive OS shows in its windows - see
// portfolio-inner-site/src/components/showcase/*. Keep the two in sync when
// portfolio copy changes.

import { ROUTES, routeForPath, SITE } from './site-meta.mjs';

const NAV = [
    { href: '/about', label: 'About' },
    { href: '/experience', label: 'Experience' },
    { href: '/projects', label: 'Projects' },
    { href: '/projects/mobile', label: 'Mobile projects' },
    { href: '/projects/web', label: 'Web projects' },
    { href: '/projects/data', label: 'Data science & ML projects' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy policy' },
];

function navExcept(path) {
    return NAV.filter((link) => link.href !== path);
}

/** @type {Record<string, {h1: string, summary: string, blocks: object[]}>} */
const COPY = {
    '/': {
        h1: 'Paul Botchwey - Mobile App Developer, Data Scientist & ML Engineer',
        summary:
            "I'm Paul Botchwey (@Codernointed), an engineer based in Accra, Ghana. I build Flutter mobile apps that ship to the Play Store, React and Next.js web platforms for real clients, and machine-learning systems in Python and TensorFlow.",
        blocks: [
            {
                p: 'This site is an interactive portfolio: a 3D scene with a retro desktop operating system running inside the monitor, where each window holds a section of my work. Every one of those sections is also available as a plain page and as markdown, so people and agents can read it without running any JavaScript.',
            },
            { h2: 'What I do' },
            {
                ul: [
                    '**Mobile development** with Flutter and Dart - shipped apps include [Somayen Delivery](https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp) and [Utim8](https://play.google.com/store/apps/details?id=io.utim8.app) on the Google Play Store.',
                    '**Web development** with React, Next.js and TypeScript - live client platforms including Nabi Fashion, AceTours, Voyage Diaries, Cornel Media and Losung Optimum.',
                    '**Data science and machine learning** with Python, TensorFlow and the scientific-Python stack - real-time eye-disease detection, sound-based anomaly detection and analytics work.',
                    '**Cloud and Web3** experiments - AWS deployments, and blockchain work on the HushSense noise-pollution project.',
                ],
            },
            { h2: 'Where to find things' },
            {
                p: 'The [about page](/about) explains who I am and how I work, [experience](/experience) covers the teams and roles, and [projects](/projects) branches into mobile, web and machine-learning work. If you want to start a conversation, the [contact page](/contact) has the form and my email.',
            },
            {
                p: `Based in ${SITE.locality}, ${SITE.countryName}. Open to freelance and contract work worldwide, remote-first. Email ${SITE.email}.`,
            },
        ],
    },

    '/about': {
        h1: 'About Paul Botchwey',
        summary:
            'An enthusiastic programmer in Accra, Ghana - Mobile App Developer, Data Scientist and ML Engineer who likes building things people actually use.',
        blocks: [
            {
                p: "I'm Paul Botchwey, a Mobile App Developer, Data Scientist and ML Engineer based in Accra, Ghana. On GitHub I go by [@Codernointed](https://github.com/Codernointed), where I have shipped 90+ repositories across mobile, web, data science, cloud and a little Web3.",
            },
            { h2: 'What I do' },
            {
                p: 'My main craft is **mobile development** with Flutter and Dart. I have taken products all the way to the Google Play Store, including the [Somayen Delivery App](https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp) and [Utim8](https://play.google.com/store/apps/details?id=io.utim8.app). More of that work is on the [mobile projects page](/projects/mobile).',
            },
            {
                p: "I'm also a **Data Scientist and ML Engineer**. I build and train models with Python and TensorFlow - Vision Infinity for real-time eye-disease detection, and a sound-based anomaly detector. Those live on the [data science and machine learning page](/projects/data).",
            },
            {
                p: 'And I build for the **web** with React, Next.js and TypeScript, shipping live client platforms such as Nabi Fashion, AceTours, Voyage Diaries and Losung Optimum. They are listed on the [web projects page](/projects/web).',
            },
            { h2: 'How I got here' },
            {
                p: "I've always been curious about how things work, and that curiosity turned into a love for building software. Over the years I've grown from small experiments into shipping real products - collaborating through engineering teams and communities like Orctatech, Bookmie, ckodon and HushSense, and contributing across the stack: mobile, web, machine learning and cloud (AWS).",
            },
            {
                p: 'For the full picture of where I have worked and what I have built, see the [experience page](/experience). My résumé is downloadable from inside the portfolio, on the about and experience windows.',
            },
            { h2: 'Get in touch' },
            {
                p: `If you have questions, or you'd like to build something together, the [contact page](/contact) is the best place to reach me - or email ${SITE.email} directly.`,
            },
        ],
    },

    '/experience': {
        h1: 'Experience',
        summary:
            'Engineering roles and long-running projects: Orctatech, Bookmie, HushSense, and independent data-science and machine-learning work.',
        blocks: [
            { h2: 'Orctatech - Mobile & Software Engineer (2023 - present)' },
            {
                p: 'Building production mobile applications with the [Orctatech Engineering Team](https://github.com/Orctatech-Engineering-Team) using Flutter and Dart, and shipping them to the Google Play Store.',
            },
            {
                ul: [
                    'Designed and developed the [Somayen Delivery App](https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp), a multi-sided delivery platform connecting customers, vendors and riders.',
                    'Implemented live order tracking, in-app payments and a responsive Flutter UI, with a focus on performance and maintainability.',
                    'Collaborated within an engineering team on code review, releases and Play Store deployment.',
                ],
            },
            { h2: 'Bookmie - Founder & Lead Developer (2023 - present)' },
            {
                p: 'Bookmie is a management platform to control and track activities in a hostel - handling bookings, rooms and occupancy in one place. The team works out of [Bookmie-Devs](https://github.com/Bookmie-Devs).',
            },
            {
                ul: [
                    'Led product direction and development across mobile and web, building the booking and management flows end to end.',
                    'Coordinated a small developer team to iterate on features and ship improvements.',
                ],
            },
            { h2: 'HushSense - Blockchain Developer (2025)' },
            {
                p: '[HushSense](https://github.com/Codernointed/hush-sense) is a Web3 project that uses blockchain and sensing to help tackle noise pollution, pairing environmental data with on-chain incentives.',
            },
            {
                ul: [
                    'Contributed to the smart-contract and application logic connecting sensor data to on-chain rewards.',
                    'Explored how decentralized incentives can drive real-world behaviour change around noise.',
                ],
            },
            { h2: 'Data Science & ML - Data Scientist & ML Engineer (2023 - present)' },
            {
                p: 'Independent and collaborative machine-learning work using Python, TensorFlow and the scientific-Python stack, published on [@Codernointed](https://github.com/Codernointed).',
            },
            {
                ul: [
                    'Built **Vision Infinity**, a real-time eye-disease detection and health-checking application powered by deep learning.',
                    'Created a **sound-based anomaly detection** system applying audio signal processing and ML to flag irregularities in real time.',
                    'Completed the British Airways data-science job simulation, covering web scraping, sentiment analysis and predictive modelling.',
                ],
            },
        ],
    },

    '/projects': {
        h1: 'Projects & Work',
        summary:
            'Mobile apps shipped to the Play Store, live web platforms for real clients, and machine-learning models - grouped into three areas.',
        blocks: [
            {
                p: 'The portfolio groups work into three areas. Each has its own page with the individual projects, the stack used, and links to the live app, store listing or repository.',
            },
            {
                ul: [
                    '[Mobile development](/projects/mobile) - Flutter and Dart apps, including two published on the Google Play Store.',
                    '[Web development](/projects/web) - React, Next.js and TypeScript platforms running in production for clients.',
                    '[Data science and machine learning](/projects/data) - deep-learning and signal-processing projects in Python and TensorFlow.',
                ],
            },
            { h2: 'How the work is usually shaped' },
            {
                p: 'Most engagements start as a single product problem - a delivery flow, a booking system, a detection model - and end with something running in front of real users. I work end to end: architecture, implementation, release, and the follow-up iteration once people start using it.',
            },
            {
                p: 'More repositories, including experiments that never became products, are on [GitHub @Codernointed](https://github.com/Codernointed). To discuss a specific project, use the [contact page](/contact).',
            },
        ],
    },

    '/projects/mobile': {
        h1: 'Mobile Development Projects',
        summary:
            'Flutter and Dart applications, including two shipped to the Google Play Store, plus AI-assisted and health-focused apps.',
        blocks: [
            { h2: 'Somayen Delivery' },
            {
                p: 'A multi-sided delivery platform connecting customers, vendors and riders, built in Flutter with live order tracking and in-app payments. [Available on Google Play](https://play.google.com/store/apps/details?id=com.orctatech.somayendeliveryapp).',
            },
            { h2: 'Utim8' },
            {
                p: 'A Flutter application published to the Play Store with the Orctatech team. [Available on Google Play](https://play.google.com/store/apps/details?id=io.utim8.app).',
            },
            { h2: 'Outfit Matcher' },
            {
                p: 'A wardrobe assistant that helps people put outfits together from clothes they already own. Source on [GitHub](https://github.com/Codernointed/outfit_matcher).',
            },
            { h2: 'AI Lecturer' },
            {
                p: 'An AI-assisted study companion that turns course material into explanations and practice. Source on [GitHub](https://github.com/Codernointed/ai_lecturer).',
            },
            { h2: 'U-Clinic' },
            {
                p: 'A university clinic application covering appointments and patient interaction. Source on [GitHub](https://github.com/Codernointed/u_clinic).',
            },
            { h2: 'Also' },
            {
                ul: [
                    '[Sign Language App](https://github.com/Codernointed/sign_language_app) - mobile sign-language learning and recognition.',
                    '[MIL mobile game](https://github.com/Codernointed/mil-mobile-game) - a game built for mobile.',
                ],
            },
            {
                p: 'Typical stack: Flutter, Dart, Firebase, REST APIs, Play Store release management. To talk about a mobile build, see the [contact page](/contact).',
            },
        ],
    },

    '/projects/web': {
        h1: 'Web Development Projects',
        summary:
            'Live React, Next.js and TypeScript platforms running in production for clients and communities.',
        blocks: [
            { h2: 'Nabi Fashion' },
            {
                p: 'A fashion brand storefront and showcase, live at [nabifashion.com](https://nabifashion.com).',
            },
            { h2: 'AceTours' },
            {
                p: 'A travel and tours platform, live at [acetours.vercel.app](https://acetours.vercel.app).',
            },
            { h2: 'Voyage Diaries' },
            {
                p: 'A travel-story and itinerary site, live at [voyagediaries.vercel.app](https://voyagediaries.vercel.app/).',
            },
            { h2: 'Cornel Media' },
            {
                p: 'A media company site, live at [cornelmedia.vercel.app](https://cornelmedia.vercel.app/).',
            },
            { h2: 'Losung Optimum' },
            {
                p: 'A business platform, live at [losungoptimum.com](https://losungoptimum.com).',
            },
            {
                p: 'Typical stack: React, Next.js, TypeScript, Tailwind, Vercel deployment and analytics. More repositories are on [GitHub @Codernointed](https://github.com/Codernointed), and new web work can be discussed through the [contact page](/contact).',
            },
        ],
    },

    '/projects/data': {
        h1: 'Data Science & Machine Learning Projects',
        summary:
            'Deep-learning, signal-processing and analytics projects built with Python, TensorFlow and the scientific-Python stack.',
        blocks: [
            { h2: 'Vision Infinity' },
            {
                p: 'A real-time eye-disease detection and health-checking application powered by deep learning, built to run against live camera input. Source on [GitHub](https://github.com/Codernointed/vision-infinity).',
            },
            { h2: 'Sound-Based Anomaly Detection' },
            {
                p: 'An anomaly-detection system that applies audio signal processing and machine learning to flag irregularities in real time. Source on [GitHub](https://github.com/Codernointed/Sound-Based-Anomaly-Detection).',
            },
            { h2: 'British Airways - Data Science' },
            {
                p: 'The British Airways data-science job simulation: web scraping, customer-review sentiment analysis and predictive modelling. Source on [GitHub](https://github.com/Codernointed/British-Airways-Data-Science).',
            },
            { h2: 'HushSense - Web3' },
            {
                p: 'Blockchain and environmental sensing combined to tackle noise pollution, pairing sensor data with on-chain incentives. Source on [GitHub](https://github.com/Codernointed/hush-sense).',
            },
            {
                p: 'Typical stack: Python, TensorFlow, NumPy, pandas, scikit-learn, Jupyter, and AWS for training and deployment. For model or analytics work, get in touch through the [contact page](/contact).',
            },
        ],
    },

    '/contact': {
        h1: 'Contact Paul Botchwey',
        summary:
            'Email, contact form, GitHub and LinkedIn - and what to include so the first reply is useful.',
        blocks: [
            {
                p: `The fastest route is email: **${SITE.email}**. Messages sent through the contact form inside the portfolio are delivered to that same address; if the form's email service is unavailable, the form falls back to opening your own mail client with the message pre-filled.`,
            },
            { h2: 'Channels' },
            {
                ul: [
                    `Email: ${SITE.email}`,
                    'GitHub: [github.com/Codernointed](https://github.com/Codernointed)',
                    'LinkedIn: [linkedin.com/in/paulbotchwey](https://www.linkedin.com/in/paulbotchwey/)',
                    'Contact form: [paulbotchwey.com/contact](/contact) - name, email, company (optional) and message.',
                ],
            },
            { h2: 'What to include' },
            {
                p: 'A short description of the product or problem, the platform you need (mobile, web, or a model), your rough timeline, and whether the work is a fixed scope or ongoing. That is usually enough for a concrete first answer rather than a round of questions.',
            },
            { h2: 'Availability' },
            {
                p: `Based in ${SITE.locality}, ${SITE.countryName} (GMT). Open to freelance, contract and collaborative work, remote worldwide. Replies usually go out within a couple of working days.`,
            },
        ],
    },

    '/privacy': {
        h1: 'Privacy Policy',
        summary: `How paulbotchwey.com handles the small amount of data it collects. Last updated ${SITE.updated}.`,
        blocks: [
            {
                p: 'This site is a personal portfolio operated by Paul Botchwey. It does not sell products, does not run advertising, does not sell or share personal data with data brokers, and does not attempt to build profiles of visitors beyond basic usage analytics.',
            },
            { h2: 'What is collected' },
            {
                ul: [
                    '**Product analytics.** The site uses PostHog (EU region) to count page views and interactions. Analytics requests are proxied through this domain under /ingest so that privacy tooling does not silently break the site. PostHog sets a cookie to recognise a returning browser; person profiles are only created for identified users, which this site does not do.',
                    '**Traffic analytics.** Vercel Analytics records aggregate page-view metrics for the deployment.',
                    '**Contact form submissions.** When you send a message, the name, email address, optional company and message body you typed are transmitted to the site owner. Nothing else from your session is attached.',
                ],
            },
            { h2: 'How contact messages are handled' },
            {
                p: `Form submissions are delivered by the Resend email API to ${SITE.email}. If that service is not reachable, the form instead opens your own email client with the message pre-filled, and nothing is sent to any third party. Messages are kept in the owner's mailbox only for as long as needed to answer them and any follow-up conversation.`,
            },
            { h2: 'Processors' },
            {
                ul: [
                    'Vercel - hosting, edge network and traffic analytics.',
                    'PostHog (EU) - product analytics.',
                    'Resend - transactional delivery of contact-form messages.',
                    'Adobe Typekit / Google Play and GitHub links - fonts and outbound links; these providers see requests you make to them.',
                ],
            },
            { h2: 'Cookies' },
            {
                p: 'The only cookies set by this domain come from the analytics described above. No advertising or cross-site tracking cookies are used. Blocking cookies, or sending a Do Not Track / Global Privacy Control signal, does not prevent any part of the site from working.',
            },
            { h2: 'Your choices' },
            {
                p: `To ask what has been stored about you, to correct it, or to have it deleted, email ${SITE.email} with the address you used. Requests are handled as quickly as is practical and in any case within 30 days. Because analytics are aggregate and pseudonymous, deletion generally means removing any contact-form correspondence and, on request, the analytics identifier tied to your browser.`,
            },
            { h2: 'Changes' },
            {
                p: 'If this policy changes, the updated date at the top of this page changes with it. Material changes will also be noted on the site itself.',
            },
        ],
    },
};

/**
 * @typedef {object} Page
 * @property {import('./site-meta.mjs').SiteRoute} route
 * @property {string} h1
 * @property {string} summary
 * @property {object[]} blocks
 * @property {{href: string, label: string}[]} links
 */

/** @type {Page[]} */
export const PAGES = ROUTES.map((route) => {
    const copy = COPY[route.path];
    if (!copy) throw new Error(`No page copy for route ${route.path}`);
    return { route, ...copy, links: navExcept(route.path) };
});

/** @returns {Page} */
export function pageForPath(path) {
    const route = routeForPath(path);
    const page = PAGES.find((candidate) => candidate.route === route);
    if (!page) throw new Error(`No page for path ${path}`);
    return page;
}
