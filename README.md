# Random Fuji Recipe

A web app that picks a random Fujifilm film simulation recipe. The data comes from [fujirecipes.io/recipes](https://fujirecipes.io/recipes).

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 + shadcn/ui
- Light / Dark / System theme (next-themes)
- Each recipe has its own shareable link: `/?r=<slug>`
- Press `Space` or `R` to shuffle

## Requirements

Node.js **>= 22.12** (Tailwind's Turbopack loader needs `require()` of ES modules). Node 24 LTS is recommended (see `.nvmrc`).

## Development

```bash
npm install
npm run dev
```

## Refreshing the recipe data

The data is stored statically in `src/data/recipes.json`. To fetch it again from fujirecipes.io:

```bash
npm run scrape
```

Then commit the updated `recipes.json`.

## Deploying to Vercel (Hobby/free)

1. Push the repo to GitHub.
2. In Vercel, go to **Add New → Project → Import** the repo.
3. Keep the defaults (Framework: Next.js, Build: `next build`). You don't need any environment variables.
4. The Node version is pinned to 24.x through `engines.node` in `package.json`. You can check it under **Settings → Build and Deployment → Node.js Version** (pick 22.x or 24.x).
