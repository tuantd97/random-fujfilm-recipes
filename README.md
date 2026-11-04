# Random Fuji Recipe

A web app that picks a random Fujifilm film simulation recipe. The data comes from [fujirecipes.io/recipes](https://fujirecipes.io/recipes).

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 + shadcn/ui
- Light / Dark / System theme (next-themes)
- Each recipe has its own shareable link: `/?r=<slug>`
- Press `Space` or `R` to shuffle

## Requirements

- Node.js **>= 22.12** (Tailwind's Turbopack loader needs `require()` of ES modules). Node 24 LTS is recommended (see `.nvmrc`).
- **Yarn 1 (classic)**: the project uses Yarn only, not npm. The version is pinned in the `packageManager` field of `package.json` (`yarn@1.22.22`).

If Yarn isn't installed yet:

```bash
npm install -g yarn
```

or use Corepack, which ships with Node:

```bash
corepack enable
```

## Development

```bash
yarn install
yarn dev
```

Other commands:

| Command | Purpose |
| --- | --- |
| `yarn add <pkg>` | Add a dependency |
| `yarn add -D <pkg>` | Add a dev dependency |
| `yarn remove <pkg>` | Remove a package |
| `yarn build` | Production build |
| `yarn start` | Run the build |
| `yarn lint` | Run ESLint |

To add a shadcn/ui component:

```bash
npx shadcn@latest add <component>
```

(`npx` only runs the CLI. Yarn 1 doesn't have `dlx`. The shadcn CLI detects `yarn.lock` and installs dependencies with Yarn.)

> Don't run `npm install`: it creates a `package-lock.json` (that file is already in `.gitignore`), and two lockfiles in the repo will confuse Vercel.

## Refreshing the recipe data

The data is stored statically in `src/data/recipes.json`. To fetch it again from fujirecipes.io:

```bash
yarn scrape
```

Then commit the updated `recipes.json`.

## Deploying to Vercel (Hobby/free)

1. Push the repo to GitHub.
2. In Vercel, go to **Add New → Project → Import** the repo.
3. Keep the defaults (Framework: Next.js). Vercel sees `yarn.lock` and runs `yarn install` and `yarn build` on its own, so you don't need to change the Install/Build Command or add any environment variables.
4. Node.js version: under **Settings → Build and Deployment → Node.js Version**, pick **24.x** (or 22.x). `engines.node` in `package.json` requires >= 22.12.
