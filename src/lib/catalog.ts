import { getCollection, type CollectionEntry } from 'astro:content';
import { intlLocale, ui, type Lang } from '../i18n';

export type Product = CollectionEntry<'products'>;
export type Category = CollectionEntry<'categories'>;
export type ProductCollection = CollectionEntry<'collections'>;

const formatters = {
  en: new Intl.NumberFormat(intlLocale.en, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
  sr: new Intl.NumberFormat(intlLocale.sr, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
};

/** €2,300 (en) / 2.300 € (sr), or "Price on request". */
export function formatPrice(p: Product, lang: Lang = 'en'): string {
  if (p.data.priceOnRequest || p.data.price === undefined) return ui[lang].product.priceOnRequest;
  return formatters[lang].format(p.data.price);
}

type Label = { one: string; many: string };

/** Singular and plural labels per product type. */
export const typeLabels: Record<Lang, Record<string, Label>> = {
  en: {
    dress: { one: 'Dress', many: 'Dresses' },
    corset: { one: 'Corset', many: 'Corsets' },
    top: { one: 'Top', many: 'Tops & blouses' },
    blazer: { one: 'Blazer', many: 'Blazers' },
    denim: { one: 'Denim', many: 'Denim' },
    necklace: { one: 'Necklace', many: 'Necklaces' },
    choker: { one: 'Choker', many: 'Chokers' },
    earrings: { one: 'Earrings', many: 'Earrings' },
    bracelet: { one: 'Bracelet', many: 'Bracelets' },
    set: { one: 'Jewelry set', many: 'Jewelry sets' },
    headband: { one: 'Headband', many: 'Headbands' },
    headpiece: { one: 'Headpiece', many: 'Headpieces' },
    crown: { one: 'Crown', many: 'Crowns' },
    'hair-comb': { one: 'Hair comb', many: 'Hair combs' },
    'hair-pin': { one: 'Hair pin', many: 'Hair pins' },
    'hair-bow': { one: 'Hair bow', many: 'Hair bows' },
    'face-jewelry': { one: 'Face jewelry', many: 'Face jewelry' },
    'crystal-straps': { one: 'Crystal straps', many: 'Crystal straps' },
    gloves: { one: 'Crystal gloves', many: 'Gloves' },
    veil: { one: 'Head veil', many: 'Veils' },
    tie: { one: 'Tie', many: 'Ties' },
  },
  sr: {
    dress: { one: 'Haljina', many: 'Haljine' },
    corset: { one: 'Korset', many: 'Korseti' },
    top: { one: 'Top', many: 'Topovi i bluze' },
    blazer: { one: 'Sako', many: 'Sakoi' },
    denim: { one: 'Džins', many: 'Džins' },
    necklace: { one: 'Ogrlica', many: 'Ogrlice' },
    choker: { one: 'Čoker', many: 'Čokeri' },
    earrings: { one: 'Minđuše', many: 'Minđuše' },
    bracelet: { one: 'Narukvica', many: 'Narukvice' },
    set: { one: 'Set nakita', many: 'Setovi nakita' },
    headband: { one: 'Traka za kosu', many: 'Trake za kosu' },
    headpiece: { one: 'Ukras za glavu', many: 'Ukrasi za glavu' },
    crown: { one: 'Kruna', many: 'Krune' },
    'hair-comb': { one: 'Češalj za kosu', many: 'Češljevi za kosu' },
    'hair-pin': { one: 'Šnala', many: 'Šnale' },
    'hair-bow': { one: 'Mašna za kosu', many: 'Mašne za kosu' },
    'face-jewelry': { one: 'Nakit za lice', many: 'Nakit za lice' },
    'crystal-straps': { one: 'Kristalne bretele', many: 'Kristalne bretele' },
    gloves: { one: 'Kristalne rukavice', many: 'Rukavice' },
    veil: { one: 'Veo', many: 'Velovi' },
    tie: { one: 'Kravata', many: 'Kravate' },
  },
};

export const categoryName = (c: Category, lang: Lang) => (lang === 'sr' ? c.data.nameSr : c.data.name);
export const categoryIntro = (c: Category, lang: Lang) => (lang === 'sr' ? c.data.introSr : c.data.intro);

/** Product URL: same pattern as the old site (prefixed with /sr for Serbian). */
export const productUrl = (p: Product, lang: Lang = 'en') => `${lang === 'sr' ? '/sr' : ''}/product/${p.id}/`;

const byOrder = (a: Product, b: Product) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name);

export async function getProducts(): Promise<Product[]> {
  return (await getCollection('products')).sort(byOrder);
}

export async function getCategories(): Promise<Category[]> {
  return (await getCollection('categories')).sort((a, b) => a.data.order - b.data.order);
}

export async function getProductCollections(): Promise<ProductCollection[]> {
  return (await getCollection('collections')).sort((a, b) => a.data.order - b.data.order);
}

export function productsIn(products: Product[], categoryId: string): Product[] {
  return products.filter((p) => p.data.category.id === categoryId);
}

/** Types present in a product list, in the order defined in typeLabels. */
export function typesIn(products: Product[]): string[] {
  const present = new Set(products.map((p) => p.data.type).filter(Boolean));
  return Object.keys(typeLabels.en).filter((t) => present.has(t as Product['data']['type']));
}
