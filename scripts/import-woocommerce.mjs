#!/usr/bin/env node
/**
 * Import products from the old WooCommerce site (Store API) into src/content/products/*.md
 * and download full-size product photos into src/assets/products/<slug>/.
 *
 * READ-ONLY towards the old site: only GET requests, only to katrielaccessories.com and its
 * Jetpack image CDN (i0/i1/i2/i3.wp.com). Nothing on the old site is ever changed.
 *
 * Usage:
 *   node scripts/import-woocommerce.mjs                     dry run: fetch + report, writes nothing
 *   node scripts/import-woocommerce.mjs --write             write new product files + download photos
 *   node scripts/import-woocommerce.mjs --write --force     also overwrite existing product files/photos
 *   node scripts/import-woocommerce.mjs --write --remove-unmatched
 *                                                           also delete product files whose slug is not
 *                                                           on the old site (e.g. the sample products)
 */
import { mkdir, writeFile, readdir, rm, access } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS_DIR = join(ROOT, 'src/content/products');
const ASSETS_DIR = join(ROOT, 'src/assets/products');
const API = 'https://katrielaccessories.com/wp-json/wc/store/v1/products';
const PER_PAGE = 100;
const ALLOWED_HOSTS = /^(katrielaccessories\.com|www\.katrielaccessories\.com|i[0-3]\.wp\.com)$/;
const USER_AGENT = 'Mozilla/5.0 (compatible; katriel-import/1.0)';

// Oversized originals are shrunk before they go into the repo (Astro re-optimizes at build anyway).
const MAX_EDGE = 2000;
const MAX_BYTES = 800 * 1024;

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const FORCE = args.has('--force');
const REMOVE_UNMATCHED = args.has('--remove-unmatched');

// ---------------------------------------------------------------------------
// Mapping: old WooCommerce category path → new category + product type
// Keys are the path after /product-category/ (parent/child).
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  'clothes': { category: 'clothing' }, // type is derived from the name, see clothingType()
  'jewelry/necklaces': { category: 'jewelry', type: 'necklace' },
  'jewelry/chokers': { category: 'jewelry', type: 'choker' },
  'jewelry/earrings': { category: 'jewelry', type: 'earrings' },
  'jewelry/bracelets': { category: 'jewelry', type: 'bracelet' },
  'jewelry/jewelry-sets': { category: 'jewelry', type: 'set' },
  'accessories/headband': { category: 'accessories', type: 'headband' },
  'accessories/headpiece': { category: 'accessories', type: 'headpiece' },
  'accessories/crowns': { category: 'accessories', type: 'crown' },
  'accessories/hair-combs': { category: 'accessories', type: 'hair-comb' },
  'accessories/hair-pins': { category: 'accessories', type: 'hair-pin' },
  'accessories/hair-bow': { category: 'accessories', type: 'hair-bow' },
  'accessories/face-jewelry': { category: 'accessories', type: 'face-jewelry' },
  'accessories/crystal-straps': { category: 'accessories', type: 'crystal-straps' },
  // Top-level categories on the old site without a clear home: placed in accessories, flagged for review.
  'crystal-glove': { category: 'accessories', type: 'gloves', review: true },
  'crystal-head-veil': { category: 'accessories', type: 'veil', review: true },
  'ties': { category: 'accessories', type: 'tie', review: true },
};

function clothingType(name) {
  const n = name.toLowerCase();
  if (/corset|korset/.test(n)) return 'corset';
  if (/dress|haljina|gown/.test(n)) return 'dress';
  if (/blazer|sako|jacket/.test(n)) return 'blazer';
  if (/denim|jeans|shorts/.test(n)) return 'denim';
  if (/top|blouse|bluza|bodysuit|bra\b/.test(n)) return 'top';
  return undefined;
}

// ---------------------------------------------------------------------------
// HTTP: GET only, allow-listed hosts only
// ---------------------------------------------------------------------------
async function get(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.test(u.hostname)) {
    throw new Error(`Blocked request to non-allowed host: ${u.href}`);
  }
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(u, { method: 'GET', headers: { 'User-Agent': USER_AGENT, Accept: '*/*' } });
    if (res.ok) return res;
    if (attempt >= 3 || res.status < 500) throw new Error(`GET ${u.href} → HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
}

async function getAllProducts(extraQuery = '') {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await get(`${API}?per_page=${PER_PAGE}&page=${page}&orderby=menu_order&order=asc${extraQuery}`);
    const items = await res.json();
    all.push(...items);
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? 1);
    if (page >= totalPages || items.length === 0) break;
  }
  return all;
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', euro: '€' };
function decode(s = '') {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}
const stripTags = (html = '') => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** Clean WordPress description HTML for the Markdown body (HTML is valid Markdown). */
function cleanHtml(html = '') {
  return html
    .replace(/<p>(\s|&nbsp;| )*<\/p>/gi, '')
    .replace(/\s+(class|style|id|data-[\w-]+)="[^"]*"/gi, '')
    .replace(/<\/?span>/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function metaDescription(p) {
  const text = stripTags(p.short_description) || stripTags(p.description);
  if (!text) return undefined;
  if (text.length <= 155) return text;
  return text.slice(0, 154).replace(/\s+\S*$/, '') + '…';
}


// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------
/** Full-size original URL: drop Jetpack CDN, query string and any -300x300 size suffix. */
function originalImageUrl(src) {
  const u = new URL(src);
  let url;
  if (/^i[0-3]\.wp\.com$/.test(u.hostname)) {
    // https://i0.wp.com/katrielaccessories.com/wp-content/... → https://katrielaccessories.com/wp-content/...
    url = new URL(`https:/${u.pathname}`);
  } else {
    url = new URL(u.origin + u.pathname);
  }
  url.pathname = url.pathname.replace(/-\d+x\d+(?=\.\w+$)/, '');
  return url.href;
}

function uploadMonth(url) {
  const m = url.match(/\/uploads\/(\d{4})\/(\d{2})\//);
  return m ? `${m[1]}-${m[2]}-01` : undefined;
}

let sharp;
async function saveImage(url, file) {
  const res = await get(url);
  let buf = Buffer.from(await res.arrayBuffer());
  const originalBytes = buf.length;
  sharp ??= (await import('sharp')).default;
  const img = sharp(buf, { failOn: 'none' }).rotate();
  const meta = await img.metadata();
  const edge = Math.max(meta.width ?? 0, meta.height ?? 0);
  let shrunk = false;
  if (edge > MAX_EDGE || originalBytes > MAX_BYTES) {
    let pipeline = img.resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });
    const ext = extname(file).toLowerCase();
    if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9, palette: true });
    else if (ext === '.webp') pipeline = pipeline.webp({ quality: 85 });
    else pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
    buf = await pipeline.toBuffer();
    shrunk = true;
  }
  await writeFile(file, buf);
  return { originalBytes, bytes: buf.length, shrunk, width: meta.width, height: meta.height };
}

async function pool(items, size, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await fn(items[idx], idx);
      }
    }),
  );
  return results;
}

const exists = (p) => access(p).then(() => true, () => false);

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------
const q = (s) => JSON.stringify(s); // JSON strings are valid YAML

function toMarkdown(prod) {
  const lines = ['---', `name: ${q(prod.name)}`, `category: ${prod.category}`];
  if (prod.type) lines.push(`type: ${prod.type}`);
  lines.push('collections: []');
  if (prod.price !== undefined) lines.push(`price: ${prod.price}`);
  if (prod.priceOnRequest) lines.push('priceOnRequest: true');
  lines.push(`featured: ${prod.featured}`);
  lines.push(`order: ${prod.order}`);
  if (prod.addedAt) lines.push(`addedAt: ${prod.addedAt}`);
  if (prod.images.length) {
    lines.push('images:');
    for (const img of prod.images) {
      lines.push(`  - { src: ${q(`../../assets/products/${prod.slug}/${img.file}`)}, alt: ${q(img.alt)}, role: ${img.role} }`);
    }
  } else {
    lines.push('images: []');
  }
  if (prod.description) lines.push(`description: ${q(prod.description)}`);
  lines.push('# Imported from WooCommerce product ' + prod.wcId + ' (' + prod.permalink + ')');
  lines.push('---', '', prod.body, '');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`${WRITE ? 'WRITE' : 'DRY RUN'}: fetching products from ${API} (GET only)…\n`);

  const raw = await getAllProducts();
  const featuredIds = new Set((await getAllProducts('&featured=true')).map((p) => p.id));

  const issues = { review: [], noDescription: [], noImages: [], noPrice: [], noType: [], multiCategory: [], unmapped: [], currency: [], fewImages: [] };
  const products = [];

  raw.forEach((p, index) => {
    const name = decode(p.name).trim();
    const slug = decodeURIComponent(p.slug);
    const paths = p.categories.map((c) => c.link.replace(/^.*\/product-category\//, '').replace(/\/$/, ''));
    // Products without any category on the old site go to accessories (flagged for review).
    const path = paths.find((x) => CATEGORY_MAP[x]) ?? paths[0] ?? '(none)';
    const mapped = paths.length ? CATEGORY_MAP[path] : { category: 'accessories', review: true };

    if (!mapped) {
      issues.unmapped.push(`${slug} (${paths.join(', ') || 'no category'})`);
      return;
    }
    if (paths.length > 1) issues.multiCategory.push(`${slug}: ${paths.join(', ')} → used ${path}`);
    if (mapped.review) issues.review.push(`${slug}: old category "${path}" → ${mapped.category}${mapped.type ? "/" + mapped.type : ""}`);

    const type = mapped.type ?? clothingType(name);
    if (!type) issues.noType.push(`${slug} ("${name}")`);

    // Price: Store API returns minor units as a string ("230000" = €2,300.00).
    const minor = p.prices.currency_minor_unit ?? 2;
    const priceNum = p.prices.price ? Number(p.prices.price) / 10 ** minor : 0;
    if (p.prices.currency_code !== 'EUR') issues.currency.push(`${slug}: ${p.prices.currency_code}`);
    const priceOnRequest = !priceNum;
    if (priceOnRequest) issues.noPrice.push(`${slug} ("${name}") → "Price on request"`);
    if (priceNum && !Number.isInteger(priceNum)) issues.review.push(`${slug}: price has cents (${priceNum})`);

    // Images: full size, de-duplicated.
    const seen = new Set();
    const images = [];
    for (const img of p.images) {
      const url = originalImageUrl(img.src);
      if (seen.has(url)) continue;
      seen.add(url);
      const n = images.length + 1;
      const ext = (extname(new URL(url).pathname) || '.jpg').toLowerCase().replace('.jpeg', '.jpg');
      images.push({
        url,
        file: `${String(n).padStart(2, '0')}${ext}`,
        alt: decode(img.alt).trim() || `${name} — photo ${n}`,
        // The Store API has no photo roles. First photo = main (on-model), rest = packshot. Check manually.
        role: n === 1 ? 'on-model' : 'packshot',
      });
    }
    if (!images.length) issues.noImages.push(slug);
    else if (images.length === 1) issues.fewImages.push(slug);

    const body = cleanHtml(p.description || p.short_description);
    if (!body) issues.noDescription.push(slug);

    products.push({
      wcId: p.id,
      permalink: p.permalink,
      slug,
      name,
      category: mapped.category,
      type,
      price: priceOnRequest ? undefined : priceNum,
      priceOnRequest,
      featured: featuredIds.has(p.id),
      order: (index + 1) * 10,
      addedAt: images[0] ? uploadMonth(images[0].url) : undefined,
      images,
      description: metaDescription(p),
      body,
    });
  });

  // Existing files
  await mkdir(PRODUCTS_DIR, { recursive: true });
  const existingFiles = (await readdir(PRODUCTS_DIR)).filter((f) => f.endsWith('.md'));
  const existingSlugs = new Set(existingFiles.map((f) => f.replace(/\.md$/, '')));
  const importSlugs = new Set(products.map((p) => p.slug));
  const toCreate = products.filter((p) => !existingSlugs.has(p.slug));
  const toOverwrite = products.filter((p) => existingSlugs.has(p.slug));
  const unmatched = [...existingSlugs].filter((s) => !importSlugs.has(s)).sort();

  // ---------- Write ----------
  let imageStats = { files: 0, skipped: 0, shrunk: 0, bytesIn: 0, bytesOut: 0, failed: [] };
  let written = 0;
  let skipped = 0;
  if (WRITE) {
    for (const prod of products) {
      const mdPath = join(PRODUCTS_DIR, `${prod.slug}.md`);
      if (existingSlugs.has(prod.slug) && !FORCE) {
        skipped++;
        continue;
      }
      const dir = join(ASSETS_DIR, prod.slug);
      await mkdir(dir, { recursive: true });
      await pool(prod.images, 4, async (img) => {
        const file = join(dir, img.file);
        if (!FORCE && (await exists(file))) {
          imageStats.skipped++;
          return;
        }
        try {
          const r = await saveImage(img.url, file);
          imageStats.files++;
          imageStats.bytesIn += r.originalBytes;
          imageStats.bytesOut += r.bytes;
          if (r.shrunk) imageStats.shrunk++;
        } catch (e) {
          imageStats.failed.push(`${prod.slug}/${img.file}: ${e.message}`);
        }
      });
      // Drop images that failed to download so the build does not break.
      const failed = new Set(imageStats.failed.filter((f) => f.startsWith(`${prod.slug}/`)).map((f) => f.split(':')[0].split('/')[1]));
      prod.images = prod.images.filter((i) => !failed.has(i.file));
      await writeFile(mdPath, toMarkdown(prod));
      written++;
      process.stdout.write(`\r  written ${written}/${products.length}`);
    }
    if (written) process.stdout.write('\n');
    if (REMOVE_UNMATCHED) {
      for (const slug of unmatched) {
        await rm(join(PRODUCTS_DIR, `${slug}.md`));
        await rm(join(ASSETS_DIR, slug), { recursive: true, force: true });
      }
    }
  }

  // ---------- Report ----------
  const byCat = {};
  for (const p of products) {
    const key = `${p.category}${p.type ? ' / ' + p.type : ''}`;
    byCat[key] = (byCat[key] ?? 0) + 1;
  }
  const totalImages = products.reduce((n, p) => n + p.images.length, 0);
  const list = (title, arr, limit = 200) => {
    console.log(`\n${title}: ${arr.length}`);
    arr.slice(0, limit).forEach((x) => console.log(`  - ${x}`));
    if (arr.length > limit) console.log(`  … and ${arr.length - limit} more`);
  };

  console.log('='.repeat(70));
  console.log(`REPORT (${WRITE ? 'write' : 'dry run, nothing written'})`);
  console.log('='.repeat(70));
  console.log(`Products on old site:     ${raw.length}`);
  console.log(`Imported (mapped):        ${products.length}`);
  console.log(`  new files:              ${toCreate.length}`);
  console.log(`  already exist:          ${toOverwrite.length}${toOverwrite.length ? (FORCE ? ' (overwritten)' : ' (skipped, use --force)') : ''}`);
  console.log(`Photos (full size):       ${totalImages}`);
  console.log(`Featured on old site:     ${featuredIds.size}`);
  if (WRITE) {
    console.log(`Files written:            ${written}${skipped ? `, skipped ${skipped}` : ''}`);
    console.log(`Photos downloaded:        ${imageStats.files} (${(imageStats.bytesIn / 1e6).toFixed(1)} MB → ${(imageStats.bytesOut / 1e6).toFixed(1)} MB, ${imageStats.shrunk} shrunk), already present ${imageStats.skipped}`);
  }

  console.log('\nBy category / type:');
  Object.entries(byCat).sort().forEach(([k, v]) => console.log(`  ${k.padEnd(32)} ${v}`));

  console.log('\n--- MISSING ---');
  list('No description (left empty, as on the old site)', issues.noDescription);
  list('No photos', issues.noImages);
  list('Only 1 photo', issues.fewImages);
  list('No price (→ "Price on request")', issues.noPrice);

  console.log('\n--- CHECK MANUALLY ---');
  list('Clothing without a type (only under "All")', issues.noType);
  list('Category mapping to confirm', issues.review);
  list('More than one category on old site', issues.multiCategory);
  list('Not imported: unknown category', issues.unmapped);
  list('Non-EUR currency', issues.currency);
  if (WRITE) list('Photo downloads that failed', imageStats.failed);
  list(
    `Product files in the repo that are NOT on the old site${REMOVE_UNMATCHED && WRITE ? ' (deleted)' : ' (keep or delete with --remove-unmatched)'}`,
    unmatched,
  );
  console.log('\nAlways check: photo roles (1st = on-model, rest = packshot), alt texts, "addedAt" (taken from the');
  console.log('photo upload month, the Store API has no product date), collections (not on the old site), bridal/stage/kids');
  console.log('(no matching categories on the old site, these pages stay empty).');
}

main().catch((e) => {
  console.error(`\nImport failed: ${e.message}`);
  process.exit(1);
});
