/**
 * Single source of truth for brand and contact data.
 * Values in [BRACKETS] and links set to '#' are placeholders waiting on the client
 * (see CLAUDE.md "Open items"). Interface text and menu labels live in src/i18n/index.ts.
 */
export const site = {
  name: 'Katriel',
  legalName: 'Katriel Accessories',
  founder: 'Danijela Jonović',
  founded: 2016,
  url: 'https://www.katrielaccessories.com',

  /** Display format, e.g. '+381 60 123 4567'. */
  phone: '[PHONE]',
  /** Digits with country code, e.g. '+381601234567'. Used for tel: links. */
  phoneHref: '[PHONE]',
  email: '[EMAIL]',
  pressEmail: 'pr@katrielaccessories.com',
  address: '[ADDRESS]',
  hours: '[OPENING HOURS]',
  freeShippingOver: '[AMOUNT]',

  instagram: {
    handle: 'katriel_accessories',
    url: 'https://www.instagram.com/katriel_accessories/',
    dm: 'https://ig.me/m/katriel_accessories',
  },
  social: [
    { label: 'Instagram', href: 'https://www.instagram.com/katriel_accessories/' },
    { label: 'Facebook', href: 'https://www.facebook.com/katrielaccessories' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@katriel.accessories' },
    { label: 'YouTube', href: '#' }, // [PLACEHOLDER] channel URL
  ],

  /** Press feature on the home page and /press/. */
  press: {
    publication: 'Vogue',
    quote: '[PLACEHOLDER: short quote from the Vogue feature]',
    edition: '[Vogue edition]',
    date: '[Month Year]',
    href: '#', // [PLACEHOLDER] link to the feature
    alsoSeenIn: ['Press Serbia', 'Shine Magazine', 'Pink TV', 'Red TV', 'Stories Within Us'],
  },

  /** Articles on /press/. The title stays in the article's original language. */
  articles: [
    {
      publication: 'Press Serbia',
      title: 'Katriel kolekcija: Glamur kao stav, moda kao scena',
      author: 'Jelena Filipović',
      date: '2025-12-29',
      href: 'https://www.pressserbia.com/katriel-kolekcija-glamur-kao-stav-moda-kao-scena/',
    },
  ],

  /** Labels are keys into the `stats` dictionary in src/i18n. */
  stats: [
    { value: '2016', label: 'Founded' },
    { value: '12', label: 'Awards' },
    { value: '43k+', label: 'Clients' },
  ],
};

export const telHref = `tel:${site.phoneHref}`;

/** Header navigation, left side: category ids (labels come from the category content). */
export const mainNavCategories = ['clothing', 'jewelry', 'accessories', 'bridal', 'stage'];
