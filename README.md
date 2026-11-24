# Random Fuji Recipe

A web app that suggests Fujifilm film simulation recipes based on the weather where you are, or picks them at random. The data comes from [fujirecipes.io/recipes](https://fujirecipes.io/recipes).

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4 + shadcn/ui
- Light / Dark / System theme (next-themes)
- **Weather where you are**: temperature, feels-like, today's high/low, rainfall, chance of rain, humidity, wind, cloud cover, UV, sunrise/sunset and golden hour
- **Top 3 recipes for the weather**, each with the reason it was suggested
- Filter by shooting condition (the 8 scene categories from fujirecipes.io); both the suggestions and the random picks only use the filtered list
- **Random** tab: draws 3 random recipes; press `Space` or `R` to draw again
- Each recipe has its own shareable link: `/?r=<slug>` (with a filter: `/?scene=<scene>&r=<slug>`)
- Shooting tips in Vietnamese for every recipe (`src/data/tips.json`)

## Weather and location

Everything runs in the browser and needs no API key:

| Data | Source |
| --- | --- |
| Weather forecast | [Open-Meteo Forecast API](https://open-meteo.com/en/docs) |
| Coordinates → city name | [BigDataCloud Reverse Geocoding (client-side, free)](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) |
| City name → coordinates (manual search) | [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) |

- Open-Meteo only works with coordinates, so the city name comes from BigDataCloud's reverse geocoding. If that service fails, the app shows the coordinates and the weather still loads.
- Weather is fetched when the page loads and when you press **Làm mới**.
- If location access is denied, a city search box appears. The city you pick is remembered in `localStorage` and used next time; press **Vị trí của tôi** to switch back to GPS.
- The browser only allows location access on HTTPS or `localhost`. That's fine on Vercel.
- Recommendation logic: `src/lib/recommend.ts` (weather → weighted signals that match recipe categories and tags).

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

The data is stored statically in `src/data/recipes.json` and `src/data/scenes.json`. To fetch it again from fujirecipes.io:

```bash
yarn scrape
```

Then commit the updated `recipes.json`.

The **Mẹo chụp** (shooting tips) section in `src/data/tips.json` is hand-written in our own words and isn't produced by the scraper. The Notes/FAQ articles on fujirecipes.io are the author's copyrighted content and aren't copied; the app only links to the original page. When a new recipe is added, add a matching entry to `tips.json` by its `slug` (the section is hidden if there isn't one).

## Deploying to Vercel (Hobby/free)

1. Push the repo to GitHub.
2. In Vercel, go to **Add New → Project → Import** the repo.
3. Keep the defaults (Framework: Next.js). Vercel sees `yarn.lock` and runs `yarn install` and `yarn build` on its own, so you don't need to change the Install/Build Command or add any environment variables.
4. Node.js version: under **Settings → Build and Deployment → Node.js Version**, pick **24.x** (or 22.x). `engines.node` in `package.json` requires >= 22.12.

## Troubleshooting

**`Cannot find module '.../node_modules/@tailwindcss/turbopack/dist/index.js'`** when running `yarn dev`

This usually happens after reinstalling `node_modules` or switching Node versions while the old Turbopack cache in `.next` is still around. To fix it:

1. Stop every running `yarn dev` (Ctrl+C), then check that nothing is still listening on port 3000: `lsof -iTCP:3000 -sTCP:LISTEN`
2. Delete the cache and start again:

```bash
rm -rf .next && yarn dev
```

If that still doesn't work, reinstall the dependencies: `rm -rf node_modules .next && yarn install && yarn dev`
