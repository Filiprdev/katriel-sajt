# Katriel — luxury jewelry & clothing catalog site

Rebuild of katrielaccessories.com as a high-end, English-language **static catalog** for Katriel, a Serbian designer label (founded 2016 by Danijela Jonović). The brand sells handcrafted jewelry, headpieces/crowns and couture clothing (crystal corsets, tops, blazers, dresses). Built by Faber Studios (Filip, solo developer) with Astro, hosted on Vercel.

Filip may write to you in Serbian. Reply in the language he uses. Code, comments, commit messages and all site copy are in English.

## Scope

**Phase 1 (build this): static catalog.** Every product has its own page with price, photos and description. There is **no cart, checkout, account, wishlist, search or admin panel**. Customers order by **phone** (`tel:` link) or **Instagram DM**. The client rarely changes products or prices; Filip updates content in the repo (with Claude Code) and redeploys.

**Later phases (do NOT build now):** a real webshop (cart, checkout, payments), then possibly an AI virtual try-on. Keep the data clean (stable slugs, numeric prices, image roles) so the catalog can be moved to a shop platform later without rework.

Never invent product data, prices, policies, contact details or press quotes. Use a visible `[PLACEHOLDER]` and list it in "Open items" below.

## Stack

- Astro (latest stable), `output: 'static'`. No SSR, no server endpoints, no Vercel adapter features.
- Content collections with a Zod schema for products, categories and collections (`src/content.config.ts`).
- Plain CSS with design tokens as custom properties. No CSS framework.
- Images through `astro:assets` (`<Image>` / `<Picture>`), optimized at **build time** to WebP/AVIF. Do not rely on Vercel's runtime image optimization.
- Minimal vanilla JS only where needed (shop filter/sort, mobile menu, Edit tabs). No UI framework.
- `@astrojs/sitemap` for the sitemap. Fonts self-hosted (e.g. Fontsource packages) or the Google Fonts link as a fallback.
- Hosting: Vercel, deployed from GitHub on push to `main`. Redirects in `vercel.json`.

Ask before adding any dependency not listed here.

## Dev environment

Filip develops on native Windows (PowerShell), in VS Code. Use Node.js LTS.

```powershell
npm install
npm run dev       # local dev server
npm run build     # must pass with zero errors before any commit
npm run preview   # check the production build locally
```

Keep paths cross-platform. Never commit secrets (there should be none).

## Project layout

```
src/
  content.config.ts        collections + schemas
  content/products/        one Markdown file per product (frontmatter + description body)
  content/categories/      jewelry, accessories, clothing, bridal, stage, kids
  content/collections/     Veronika, Dinasty, Hristina, ...
  assets/products/<slug>/  product photos (optimized at build)
  assets/brand/            logo files, hero/cover photos
  layouts/BaseLayout.astro head, SEO, header, footer, announcement bar
  components/              Header, Footer, ProductCard, ProductGallery, OrderButtons, SectionHeading, ShopListing ...
  pages/
    index.astro
    shop/index.astro, shop/[category].astro
    product/[slug].astro   same URL pattern as the old site
    collections/index.astro, collections/[slug].astro
    our-story.astro, press.astro, contact.astro, how-to-order.astro,
    shipping-returns.astro, privacy.astro, 404.astro
  styles/tokens.css, base.css
public/                    favicon, robots.txt, og images
design/                    static HTML reference of the approved design (see Design)
assets/                    logo files and brand photos delivered so far (move into src/assets)
config/site.ts             phone, Instagram handle/URLs, email, address: one source of truth
```

## Content model

Product frontmatter (validate with Zod):

File `src/content/products/<slug>.md`. The file name is the slug and must match the old site's slug
(e.g. `crystal-corset-valentina`, `necklase-stefy`, typos included), because URLs depend on it.

```yaml
name: "Crystal corset “Valentina”"
category: clothing         # reference to categories
type: corset               # see productTypes in src/content.config.ts; optional
collections: []            # references
price: 2300                # number, EUR
priceOnRequest: false      # true → show "Price on request" instead of a number
featured: false            # shows in "The Edit" on the home page (falls back to shop order)
order: 10                  # manual sort ("Featured"), from the old site's menu order
addedAt: 2025-05-01        # "Newest" sort
images:
  - { src: "../../assets/products/crystal-corset-valentina/01.jpg", alt: "...", role: on-model }
  - { src: "../../assets/products/crystal-corset-valentina/02.jpg", alt: "...", role: packshot }
description: "..."         # optional SEO description
```

The Markdown body is the product description (HTML from the old site is fine). Leave it empty when there is
no description. Format prices with `Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' })` (e.g. €2,300).

**No sizes.** Pieces are handmade to order, so the site has no sizes, size lists or size guide (decision, Nov 2026).

**Product page content = the old site's product page** (name, price, photos, description) in the new design.
No extra info blocks until the client provides content.

**Adding or changing a product** = add/edit one Markdown file and its photos, run `npm run build`, commit, push. Keep this workflow simple; it is how all future updates happen.

## Ordering (no checkout)

- All contact data comes from `config/site.ts`: phone `[PHONE]`, Instagram `katriel_accessories`, email, address.
- Product page shows two buttons: **Call to order** (`tel:`) and **Order on Instagram** (`https://ig.me/m/katriel_accessories`), plus the line: "Tell us the piece — we'll confirm availability, delivery and payment."
- Instagram DMs can't be pre-filled, so show the product name clearly near the buttons.
- Header right side: Collections link, phone icon, Instagram icon (each 44×44 with `aria-label`).
- Footer block "Order your piece" with the same two actions. A "How to order" page explains the process (call/message → confirmation → payment and delivery as the client defines them).

## URLs

- `/`, `/shop/`, `/shop/<category>/`, `/product/<slug>/` (same pattern as the old site), `/collections/`, `/collections/<slug>/`
- `/our-story/`, `/press/`, `/contact/`, `/how-to-order/`, `/shipping-returns/`, `/privacy/`
- 301 redirects in `vercel.json` from old WooCommerce URLs (e.g. `/product-category/<slug>/` → `/shop/<slug>/`, `/shop/` pages, cart/checkout/account → home). Build the full list from the old site before launch.

## Design

The approved design is in `design/home.html`, `design/shop.html` and `design/product.html`. They are exports from the design tool. Use them as the source of truth for layout, spacing, sizes and copy. Ignore `{{ }}` holes, `<sc-for>`/`<sc-if>` tags, the `<x-dc>` wrapper and the `support.js` script, which are design-tool syntax. Recreate them as clean Astro components and CSS classes; do not copy inline styles.

### Look

Quiet luxury: black and ivory, lots of space, large serif headlines, small wide-tracked uppercase labels. Square corners everywhere (no border-radius), no shadows, no gradients, no emoji. Photography carries the page.

### Tokens (`src/styles/tokens.css`)

```css
:root {
  --black: #000000;      /* hero background, matches the cover photo */
  --onyx: #0E0D0C;       /* announcement bar, footer */
  --ink: #141210;        /* text on light, primary buttons */
  --ivory: #F6F2EC;      /* page background, text on dark */
  --stone: #EDE7DE;      /* alternate light sections */
  --sand: #E4DDD2;       /* image placeholders on ivory */
  --sand-2: #DDD5C9;     /* placeholders on stone, hairlines on light */
  --line-input: #C9C0B3; /* chip, select and size borders */
  --text-2: #3A3632;     /* secondary body text on light */
  --muted: #6B655E;      /* meta text on light (passes 4.5:1 on ivory and stone) */
  --on-dark: #D9D3CA;    /* body text on dark */
  --muted-dark: #A39E97; /* meta text on dark */
  --line-dark: #2E2A26;  /* hairlines on dark */
  --gold: #C2A878;       /* accent on dark backgrounds only */
  --gold-text: #7A6340;  /* accent text (eyebrows) on light backgrounds */

  --font-display: 'Cormorant Garamond', 'Times New Roman', serif;
  --font-body: 'Jost', 'Helvetica Neue', Arial, sans-serif;

  --container: 1328px;
  --gutter: clamp(20px, 4vw, 56px);
  --section-y: 112px;
}
```

Fonts: Cormorant Garamond 300/400/500 + italic 300/400; Jost 300/400. Never use `--gold` as text on light backgrounds (fails contrast); use `--gold-text`.

### Type

| Role | Font | Size / tracking |
|---|---|---|
| Hero H1 | Display 300, second line italic | clamp(52px, 6.4vw, 100px), line-height 0.92 |
| Section H2 | Display 300 | clamp(40px, 4.4vw, 60px), line-height 1.05 |
| Page H1 (shop) | Display 300 | clamp(56px, 6.5vw, 96px) |
| Product H1 | Display 300 | clamp(40px, 3.8vw, 54px) |
| Product name in cards | Display 400 | 23–24px |
| Eyebrow label | Body 400, uppercase | 12px, letter-spacing 0.32em, `--gold-text` / `--gold` |
| Nav, buttons | Body 400, uppercase | 12px, letter-spacing 0.2–0.26em |
| Body | Body 300 | 16–17px, line-height 1.7 |
| Price | Body 400 | 14px (cards), 19px (product page), letter-spacing 0.06em |

### Components

- **Buttons/CTA links:** square, min-height 54–56px, padding 0 38px, uppercase 12px tracked. Primary = ink fill / ivory text (ivory fill on dark). Secondary = 1px outline. Icon + label for phone and Instagram.
- **Links:** no underline by default; hover = opacity 0.72. "Read more" links have a 1px bottom border plus an arrow icon.
- **Product card:** 3:4 image (object-fit cover), name in display serif, price below. Grid `repeat(auto-fill, minmax(260px, 1fr))`, gap 48px 24px.
- **Header:** left nav (Clothing, Jewelry, Accessories, Bridal, Stage), centered full logo with crown (`logo-black.png` on light, `logo-ivory.png` over the hero, ~54–60px tall), right: Collections, phone icon, Instagram icon. Over the hero on the home page. Collapses to a menu button on mobile.
- **Announcement bar:** onyx, 11px uppercase: "Order by phone or on Instagram · Free shipping over €[AMOUNT]".
- **Icons:** thin inline stroke SVGs (1.4px, `currentColor`), 20px, inside 44×44 hit areas.

### Pages

**Home** (minimal, in this order):
1. Hero: cover photo full-bleed, `object-fit: cover; object-position: right center` on black, min-height 880px. Text bottom-left: eyebrow "Adorned in luxury", H1 "Crafted for / *the Divine You*", one line of body copy, buttons "Shop clothing" and "Shop jewelry". Needs a separate portrait crop for mobile (pending).
2. Press, "As featured in Vogue": Vogue image left (4:5), right: "Press" eyebrow, "As featured in" (italic), huge "Vogue" set in the display serif (do NOT recreate the Vogue logo), quote, edition/date, "Read the feature" link, "Also seen in: Shine Magazine · Pink TV · Red TV · Stories Within Us".
3. "The House of Katriel": 4 category tiles (Clothing, Jewelry, Headpieces, Bridal).
4. "The Edit": Clothing/Jewelry tabs (small JS or two static lists), 4 `featured` products each.
5. Collections: typographic list of collection names in display italic.
6. The Atelier: crown mark, short brand text, stats (2016 Founded / 12 Awards / 43k+ Clients), "Our story" link.
7. Footer: "Order your piece" block (Instagram + phone), full logo, columns Shop / Discover / Client care (How to order, Contact, Shipping & returns, Privacy policy, Terms) / Follow, copyright, press email pr@katrielaccessories.com.

**Shop (category):** breadcrumb, H1 + one-line intro, category tabs (links), type filter chips and sort (Featured, Newest, Price low→high, high→low) done client-side with data attributes and progressive enhancement (all products visible without JS), product grid.

**Product:** 2-column gallery with all photos (first image on-model), info column: eyebrow (category · type), name, price, description, Call to order / Order on Instagram, "Questions about this piece? Contact the atelier", then "Complete the look" (4 related products by category or collection).

## Accessibility & quality

- Real `<a>`/`<button>`, visible focus styles, touch targets ≥ 44px, alt text on every product image.
- Text contrast ≥ 4.5:1 (the tokens above already pass where indicated).
- Responsive: test at 390px, 768px, 1440px. Grids stack, nav collapses.
- Lazy-load images below the fold; always set dimensions to avoid layout shift. Lighthouse 90+ on mobile is the target.

## SEO

Unique title and meta description per page, canonical URLs, OpenGraph images, `Product` JSON-LD on product pages (name, image, price in EUR, availability), sitemap, `robots.txt`, and the 301 map from the old site.

## Migrating content

The old site is WordPress/WooCommerce. `scripts/import-woocommerce.mjs` reads its public Store API (GET only, never changes the old site), writes one Markdown file per product with the old slug and downloads full-size photos into `src/assets/products/<slug>/` (oversized ones shrunk to 2000px). `npm run import:wc` is a dry run with a report; add `-- --write` to write (`--force` overwrites, `--remove-unmatched` deletes products that are not on the old site). Re-running with `--force` overwrites manual edits.

Known products for local development (real names and prices from the old site): Crystal corset "Valentina" €2,300, Dress "Carole" €750, Luxe blazer "Nocturne" €1,200, "Elan" €950, Crystal top "Aubra" €1,300, Necklace "Stefy" €250, Choker necklace "Royal" €180, Earrings "Papillon" €90, Headband "Monarque" €160.

Collections: Veronika, Dinasty, Hristina, I Choose Myself, Nale, Royal by Marry Ann, Iv, Lena, Red Zodiac, Hollywood Glam, Gloria, Aurelius, Lovebird, Nina (spelling as the client uses it).

## Domain & launch

- The domain will point to Vercel. Before changing DNS, record the existing MX/TXT records so the client's email on the domain keeps working.
- Keep the old site live until the new one is approved.

## Working rules

- Work in milestones and stop for review after each:
  1. Astro setup, tokens, fonts, BaseLayout, header/footer, `config/site.ts`
  2. Content collections + schema + sample products
  3. Home
  4. Shop listing (filter/sort)
  5. Product page
  6. Collections, Our story, Press, Contact, How to order, legal pages, 404
  7. SEO, sitemap, redirects, performance pass
  8. Content migration, Vercel deploy, DNS checklist
- `npm run build` must pass before saying a milestone is done.
- Small, focused commits with clear messages. Never push or deploy unless asked.

## Open items (waiting on the client)

- Phone number `[PHONE]`, email, address, opening hours
- Free shipping threshold `[AMOUNT]`, delivery countries and times, return/exchange policy, payment options for phone/Instagram orders
- Vogue: image/scan, edition, date, quote, permission to use
- Product descriptions (97 imported products have none), final product list, new dresses, all product photos
- Mobile crop of the hero photo; vector logo
- About text, legal pages (privacy, terms)
- Whether the site also needs a Serbian version

## Bilingual site and media (added Nov 2026)

- English at `/`, Serbian (Latin script) at `/sr/` (Astro i18n, `prefixDefaultLocale: false`). Same slugs in both.
- All interface text lives in `src/i18n/index.ts` (`en` and `sr` dictionaries). Use `const { t, l, lang } = useI18n(Astro)`;
  `l('/path/')` localizes internal links. Never hard-code visible text in components or views.
- Page bodies live in `src/views/*.astro`. Files in `src/pages/` and `src/pages/sr/` are thin wrappers around the
  same view (dynamic routes share `getStaticPaths` from `src/lib/paths.ts`). A new page = one view + two wrappers.
- Categories have `name`/`nameSr` and `intro`/`introSr`. Product names stay as they are; product descriptions
  (imported from the old site) are English only for now and are marked `lang="en"` on Serbian pages.
- Videos: `public/media/<group>/*.mp4`, made with `scripts/encode-videos.sh` (720p H.264, ~123 MB total).
  Posters, show stills and lookbook photos: `src/assets/media/`. `VideoCard` loads nothing until play.
- `/fashion-show/`: runway, program, backstage, gallery (stills from the runway video), "Her story" (4 chapters).
  Our story: founder, Danijela's "Lota" letter (client text, both languages), Katriel films, lookbook.
  Press: Vogue block, Press Serbia article, "Worn by" (Milica Pavlović, Dara Bubamara, Angelina).

## Celebrities (added Nov 2026)

- Data: `src/data/celebrities.ts` (name, category, photos, optional video, `home` 1–4, original `source` file names).
  `name: null` and `category: 'unknown'` show visible [PLACEHOLDER]s until the client names them.
- Page `/celebrities/` (+ `/sr/celebrities/`): one section per category (only categories with people), then all videos grouped by shape.
- Home "Celebrities in Katriel": the 4 entries with `home` set. Client rule: one singer, one actor, two others.
- Photos `src/assets/media/celebrities/<id>-1.jpg, -2.jpg …` (1400px) are found by file name, first = card photo. A person can have several videos. Small groups (1–2 people) share one section.
- Videos `public/media/celebrities/` via `scripts/encode-videos.sh`.
- The Press page links to /celebrities/ instead of showing the singer videos.

## Interviews (TV & podcasts, added Nov 2026)
- `/press/` section "Interviews / Gostovanja": Danijela's YouTube appearances, newest first, 6 shown + "Show all".
- Data: `src/data/interviews.ts` (title, channel, date, length copied from YouTube). Thumbnail: `src/assets/media/interviews/<youtube id>.jpg`, 16:9, 960px.
- Celebrities strip (4 home picks + button) is `CelebritiesStrip.astro`, used on the home page and on /press/. The home Vogue block button goes to /press/.
- `InterviewCard.astro`: a link to YouTube; with JS a click swaps in the youtube-nocookie player, so YouTube loads nothing before a click.
