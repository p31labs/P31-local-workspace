# Astro Starter Kit: Minimal

```sh
npm create astro@latest -- --template minimal
```

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).

## P31: CI and deploy (parallel to p31ca.org)

- **Monorepo:** this tree lives under `andromeda` / `p31-andromeda`. Marketing changes ship from **`phosphorus31.org/**`** only; the **p31ca.org** hub is under `software/p31ca` (separate path, separate team).
- **GitHub Actions:** [`.github/workflows/phosphorus31-site.yml`](../../.github/workflows/phosphorus31-site.yml) runs `npm ci` + `npm run build` on every PR touching this folder; **merge to `main`** deploys to Cloudflare Pages project **`phosphorus31-org`**.
- **Manual / filters:** [`.github/workflows/p31-automation.yml`](../../.github/workflows/p31-automation.yml) can also build+deploy this site when `phosphorus31.org` paths change on `main`, or via `workflow_dispatch` (toggle **deploy_phosphorus31**).
- **Local (from repo root):** `pnpm run build:phosphorus31`
