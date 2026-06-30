# paulbotchwey.com — 3D Portfolio Shell

The **3D shell** for [Paul Botchwey](https://github.com/Codernointed)'s interactive
portfolio. It renders the inner OS app inside the in-scene monitor via an iframe.

The companion **2D OS / content app** lives in `../portfolio-inner-site`.

## Local development

Run **both** apps in separate terminals:

```bash
# Terminal 1 — inner site (content)
cd portfolio-inner-site
npm install
npm start          # http://localhost:3000

# Terminal 2 — 3D shell
cd portfolio-website
npm install
npm run dev        # http://localhost:8080
```

When the 3D shell runs on `localhost`, it automatically loads the inner site from
`http://localhost:3000`. You can also force dev mode with `?dev` on the URL.

## Attribution

The 3D engine is adapted from MIT-licensed open source. See `LICENSE.md` for the
original copyright notice. All portfolio content is Paul Botchwey's.

## Contact

- GitHub: [github.com/Codernointed](https://github.com/Codernointed)
- Email: [botchweypaul0001@gmail.com](mailto:botchweypaul0001@gmail.com)
