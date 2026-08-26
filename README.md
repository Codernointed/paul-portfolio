# Paul Botchwey — Interactive Portfolio

An interactive 3D portfolio for **Paul Botchwey** ([github.com/Codernointed](https://github.com/Codernointed)) — Mobile App
Developer, Data Scientist & ML Engineer.

It is made of **two apps** that run together:

| Folder | What it is | Dev port |
|--------|-----------|----------|
| `portfolio-website` | The **3D shell** — a Three.js / WebGL scene with a computer. Renders the inner site inside the monitor via an iframe. | `8080` |
| `portfolio-inner-site` | The **2D "OS"** — a React app (the desktop, windows, and all the portfolio content: About, Projects, Experience, Contact). | `3000` |

> **Attribution:** The 3D engine is adapted from an MIT-licensed open-source
> portfolio template. See `portfolio-website/LICENSE.md` for the original
> copyright notice. All portfolio **content** (projects, copy, résumé, identity)
> is Paul Botchwey's and lives at
> [github.com/Codernointed](https://github.com/Codernointed).

---

## Publishing to GitHub

This project is intended to live under **[github.com/Codernointed](https://github.com/Codernointed)**.
Create a new repository at [github.com/Codernointed](https://github.com/Codernointed) (e.g. `paul-portfolio`), then from **this project folder** (`paul-portfolio`):

```bash
# You should already be in: .../paul-portfolio
git init
git add .
git commit -m "Initial commit: Paul Botchwey interactive portfolio"
git branch -M main
git remote add origin https://github.com/Codernointed/paul-portfolio.git
git push -u origin main
```

Replace `paul-portfolio` with whatever repo name you choose on your account.

---

You need **two terminals** running at the same time.

**Terminal 1 — the inner site (content):**

```bash
cd portfolio-inner-site
npm install        # first time only
npm start          # serves on http://localhost:3000
```

**Terminal 2 — the 3D shell:**

```bash
cd portfolio-website
npm install        # first time only
# Node 17+ needs the legacy OpenSSL provider for this older webpack:
#   Windows (PowerShell):  $env:NODE_OPTIONS="--openssl-legacy-provider"
#   macOS/Linux:           export NODE_OPTIONS=--openssl-legacy-provider
npm run dev        # serves on http://localhost:8080
```

Then open **http://localhost:8080** — when running locally, the 3D shell
automatically loads the inner site from `http://localhost:3000`. You can also use
`?dev` explicitly. Without a local dev server it loads the production OS URL
configured in `portfolio-website/src/Application/World/MonitorScreen.ts`.

---

## Deploying (Vercel)

Two Vercel projects from this monorepo — both connected to
[github.com/Codernointed/paul-portfolio](https://github.com/Codernointed/paul-portfolio) for automatic deploys on push.

| Vercel project | Root directory | URL | Role |
|----------------|----------------|-----|------|
| `codernointed-os` | `portfolio-inner-site` | https://codernointed-os.vercel.app | 2D OS (loads inside monitor) |
| `paul-portfolio` | `portfolio-website` | https://paulbotchwey.com | 3D shell (public site) |

**If Git deploys fail**, open each project in the [Vercel dashboard](https://vercel.com/dashboard) → **Settings → General → Root Directory** and set the path above.

### CLI (one-time setup already done)

```bash
# Inner site
cd portfolio-inner-site
npx vercel link --project codernointed-os
npx vercel --prod

# 3D shell
cd portfolio-website
npx vercel link --project paul-portfolio
npx vercel --prod
```

Domain **paulbotchwey.com** is attached to `paul-portfolio`. DNS uses Vercel nameservers (already configured).

---

## The agent-readable surface

The site is a WebGL scene wrapped around an iframe, so on its own it gives a
crawler almost nothing: one app shell, no text, and a rewrite that answered
`200 OK` for every path. The `site/` + `scripts/` pair fixes that without
touching how the portfolio looks or behaves.

| Where | What it does |
|-------|--------------|
| `site/site-meta.mjs` | Identity (name, email, location, profiles) and the route table: clean path → generated HTML file → markdown twin. Single source of truth. |
| `site/page-content.mjs` | The readable copy for every route, authored once as structured blocks. Mirrors the OS windows in `portfolio-inner-site/src/components/showcase/` — **keep the two in sync**. |
| `site/render.mjs` | Renders those blocks to HTML and markdown, and builds the schema.org JSON-LD graph. |
| `site/request-router.mjs` | All routing decisions (404s, markdown negotiation, the mobile proxy), as pure functions. |
| `middleware.ts` | Thin edge wrapper that turns a router decision into a Vercel response. |
| `scripts/generate-agent-files.mjs` | Post-build step: one HTML page per route, the `.md` twins, `llms.txt`, `llms-full.txt`, `agents.md`, `sitemap.xml`, `robots.txt`, `404.html`. |
| `scripts/preview-server.mjs` | Local stand-in for the Vercel edge + static layer, so the endpoints can be checked without deploying. |

What that produces on `paulbotchwey.com`:

- **Real 404s.** Unknown paths return HTTP 404 with a short markdown body
  pointing at the sitemap and `llms.txt` (HTML for browsers). No path answers
  `200` with the app shell any more.
- **Readable without JavaScript.** Every page ships its full text in the raw
  HTML inside a visually hidden `#agent-content` block, which the `<noscript>`
  stylesheet turns into a plain readable page for visitors without JS. The 3D
  scene is pixel-identical.
- **Markdown content negotiation** ([acceptmarkdown.com](https://acceptmarkdown.com)).
  `Accept: text/markdown` on any page returns the `.md` twin with
  `Vary: Accept, Accept-Encoding, User-Agent` and a `Link: …rel="alternate"`
  header. Appending `.md` to a path works too.
- **Structured data.** `Person` + `Organization` (with `contactPoint` and a
  `PostalAddress`) + `WebSite` + `WebPage`, as JSON-LD, on every page.
- **Crawlers are never proxied to the OS deployment.** That origin is
  deliberately `noindex`; bot user agents (Googlebot Smartphone included) get
  the shell HTML instead of a `noindex` page.

```bash
npm test                    # 46 tests: routing, generated files, live endpoints
npm run generate            # regenerate the agent files over an existing build
npm run preview             # serve portfolio-website/public exactly as Vercel does
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4173/nope   # 404
curl -s -H 'Accept: text/markdown' http://localhost:4173/about        # markdown
```

The generator runs automatically as part of `npm run build` in
`portfolio-website`. It rewrites specific tags in the webpack-generated
`index.html`; if one of them is renamed or removed the build fails loudly
rather than shipping a page with a stale canonical URL.

Content changes go in `site/page-content.mjs`; when copy changes, bump
`SITE.updated` in `site/site-meta.mjs` so `<lastmod>` moves with it.

---

## Things to personalize

- **Résumé:** `portfolio-inner-site/src/assets/resume/Paul_Botchwey_Resume.pdf`
  was copied from your `Documents\Paul\Paul-Botchwey.pdf`. Confirm it's the
  version you want, or replace the file (keep the name).
- **Photos:** the About page is currently text-only. Drop your own images into
  `portfolio-inner-site/src/assets/pictures/` and add them back to `About.tsx`.
- **Experience:** role titles and dates in
  `portfolio-inner-site/src/components/showcase/Experience.tsx` are sensible
  placeholders — update them to match reality.
- **Contact form:** submits via a `mailto:` link (no backend needed). To use a
  hosted form service, replace the `submitForm` body in
  `portfolio-inner-site/src/components/showcase/Contact.tsx` with a Formspree or
  EmailJS call.
- **Identity for agents:** name, email, location and social profiles live in
  `SITE` in `site/site-meta.mjs`. A phone number and street address are the two
  fields Organization schema can still take; add them there if you want them
  public.
- **Analytics:** add your own GA4 ID in
  `portfolio-website/src/index.html` if you want it.
