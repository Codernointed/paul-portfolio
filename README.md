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
Create a new repository there (e.g. `paul-portfolio`), then from this folder:

```bash
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

## Deploying

1. **Deploy the inner site** (`portfolio-inner-site`) as a normal Create React
   App build — e.g. to Vercel. Note its public URL.
2. In `portfolio-website/src/Application/World/MonitorScreen.ts`, set
   `iframe.src` (the line marked `// TODO`) to that URL.
3. **Build & deploy the 3D shell** (`portfolio-website`):
   ```bash
   npm run build   # outputs to ./dist
   ```
   Host the `dist` folder (or use `npm start` for the bundled Express server).

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
- **Meta tags / domain:** update the `TODO` URLs in
  `portfolio-website/src/index.html` once you have a domain, and add a preview
  image.
- **Analytics:** add your own GA4 ID in
  `portfolio-website/src/index.html` if you want it.
