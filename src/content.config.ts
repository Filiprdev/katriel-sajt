import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Product types. Add a value here (and a label in src/lib/catalog.ts) to introduce a new type. */
export const productTypes = [
  'dress',
  'corset',
  'top',
  'blazer',
  'denim',
  'necklace',
  'choker',
  'earrings',
  'bracelet',
  'set',
  'headband',
  'headpiece',
  'crown',
  'hair-comb',
  'hair-pin',
  'hair-bow',
  'face-jewelry',
  'crystal-straps',
  'gloves',
  'veil',
  'tie',
] as const;

const categories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/categories' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      nameSr: z.string(),
      /** One-line intro under the H1 on the shop page. */
      intro: z.string(),
      introSr: z.string(),
      /** SEO description. Falls back to the intro. */
      description: z.string().optional(),
      order: z.number(),
      /** Tile photo on the home page ("The House of Katriel"). */
      tileImage: image().optional(),
      /** Label shown in the tile while there is no photo. */
      tilePlaceholder: z.string().optional(),
    }),
});

const productCollections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/collections' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      order: z.number(),
      cover: image().optional(),
      description: z.string().optional(),
    }),
});

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      category: reference('categories'),
      /** Optional: pieces whose type is not known yet only show under "All". */
      type: z.enum(productTypes).optional(),
      collections: z.array(reference('collections')).default([]),
      /** EUR, whole number. */
      price: z.number().nonnegative().optional(),
      priceOnRequest: z.boolean().default(false),
      featured: z.boolean().default(false),
      /** Manual sort within the category ("Featured"). Lower comes first. */
      order: z.number().default(100),
      /** Used for the "Newest" sort. */
      addedAt: z.coerce.date().optional(),
      madeToOrder: z.boolean().default(false),
      images: z
        .array(
          z.object({
            src: image(),
            alt: z.string(),
            role: z.enum(['on-model', 'packshot', 'detail', 'back']),
          }),
        )
        .default([]),
      /** SEO description. Falls back to a generated one. */
      description: z.string().optional(),
    }),
});

// Astro reads this export. The product "collections" (Veronika, Dinasty, ...) are a content collection too.
export const collections = { categories, collections: productCollections, products };
