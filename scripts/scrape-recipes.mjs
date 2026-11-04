// Scrapes https://fujirecipes.io/recipes into a static JSON file.
// Run manually when you want to refresh the data: `npm run scrape`.
import { writeFile, mkdir } from "node:fs/promises";

const BASE = "https://fujirecipes.io";
const OUT = new URL("../src/data/recipes.json", import.meta.url);
const SCENES_OUT = new URL("../src/data/scenes.json", import.meta.url);

const decode = (s) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

async function get(path) {
  const res = await fetch(BASE + path, {
    headers: { "user-agent": "random-fujifilm-recipes-scraper" },
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

function parseIndex(html) {
  const entries = [];
  const re = /<a class="entry" href="\/recipes\/([^"]+)"[\s\S]*?<\/a>/g;
  for (const m of html.matchAll(re)) {
    const block = m[0];
    const pick = (cls) => {
      const r = new RegExp(`class="${cls}[^"]*"[^>]*>([\\s\\S]*?)</`);
      const hit = block.match(r);
      return hit ? decode(hit[1]) : "";
    };
    entries.push({
      slug: m[1],
      name: pick("entry__title"),
      emulates: pick("entry__emulates").replace(/^Emulates\s+/, ""),
      description: pick("entry__summary"),
      scenes: pick("entry__scenes")
        .split("·")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }
  return entries;
}

function parseDetail(html) {
  let settings = [];
  for (const m of html.matchAll(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
  )) {
    const data = JSON.parse(m[1]);
    const nodes = data["@graph"] ?? [data];
    const howTo = nodes.find((n) => n["@type"] === "HowTo");
    if (howTo) {
      settings = howTo.step.map((step) => {
        const prefix = `Set ${step.name} to `;
        let value = step.text.startsWith(prefix)
          ? step.text.slice(prefix.length)
          : step.text;
        value = value.replace(/\.$/, "");
        return { name: step.name, value };
      });
    }
  }

  const camerasBlock = html.match(/<p class="cameras-list"[\s\S]*?<\/p>/);
  const cameras = camerasBlock
    ? [...camerasBlock[0].matchAll(/href="\/cameras\/[^"]+"[^>]*>([^<]+)</g)].map(
        (m) => decode(m[1]),
      )
    : [];

  return { settings, cameras };
}

async function scrapeScenes() {
  const html = await get("/scenes");
  const slugs = [
    ...new Set([...html.matchAll(/href="\/scenes\/([^"#?]+)"/g)].map((m) => m[1])),
  ];
  const scenes = [];
  for (const slug of slugs) {
    const page = await get(`/scenes/${slug}`);
    const title = page.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const recipes = [
      ...new Set([...page.matchAll(/href="\/recipes\/([^"#?]+)"/g)].map((m) => m[1])),
    ];
    scenes.push({ slug, name: title ? decode(title[1]) : slug, recipes });
    console.log(`  ✓ scene ${slug} (${recipes.length})`);
    await new Promise((r) => setTimeout(r, 200));
  }
  return scenes;
}

async function main() {
  const index = parseIndex(await get("/recipes"));
  console.log(`Found ${index.length} recipes`);

  const scenes = await scrapeScenes();
  const known = new Set(index.map((r) => r.slug));
  for (const scene of scenes) {
    scene.recipes = scene.recipes.filter((slug) => known.has(slug));
  }

  const recipes = [];
  for (const entry of index) {
    const detail = parseDetail(await get(`/recipes/${entry.slug}`));
    if (detail.settings.length === 0) {
      console.warn(`  ! no settings for ${entry.slug}`);
    }
    recipes.push({
      ...entry,
      categories: scenes.filter((s) => s.recipes.includes(entry.slug)).map((s) => s.slug),
      ...detail,
      sourceUrl: `${BASE}/recipes/${entry.slug}`,
    });
    console.log(`  ✓ ${entry.name}`);
    await new Promise((r) => setTimeout(r, 200));
  }

  await mkdir(new URL(".", OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(recipes, null, 2) + "\n");
  await writeFile(
    SCENES_OUT,
    JSON.stringify(
      scenes.map(({ slug, name }) => ({ slug, name })),
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Wrote ${recipes.length} recipes and ${scenes.length} scenes to src/data/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
