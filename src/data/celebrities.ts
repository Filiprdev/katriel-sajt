/**
 * Celebrities wearing Katriel: /celebrities/ (and /sr/celebrities/) plus the 4-photo home section.
 *
 * Photos: src/assets/media/celebrities/<id>-1.jpg, <id>-2.jpg … (resized to 1400px). They are picked up
 * by file name, so adding a photo = adding the next numbered file. The first one is the card photo.
 * Videos: public/media/celebrities/ (encoded by scripts/encode-videos.sh); posters: src/assets/media/posters/.
 *
 * - `name: null` shows a visible [PLACEHOLDER] until the client tells us who it is.
 * - `category` groups the page. 'unknown' = not sorted yet (shown last, with a placeholder heading).
 * - `home: 1–4` picks the home section photos. Client rule: one singer, one actor, two others.
 * - `source` = original file names in Downloads/katriel_photo/celebrity_new.
 */
const photoFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/media/celebrities/*.jpg', { eager: true });
const posterFiles = import.meta.glob<{ default: ImageMetadata }>('../assets/media/posters/*.jpg', { eager: true });

/** All numbered photos for an id, in order: lepa-brena-1.jpg, lepa-brena-2.jpg … (or p02.jpg for unnamed). */
function photos(id: string): ImageMetadata[] {
  const re = new RegExp(`/${id}(-(\\d+))?\\.jpg$`);
  return Object.entries(photoFiles)
    .map(([path, m]) => ({ n: Number(path.match(re)?.[2] ?? (re.test(path) ? 0 : -1)), img: m.default }))
    .filter((p) => p.n >= 0)
    .sort((a, b) => a.n - b.n)
    .map((p) => p.img);
}
function poster(name: string): ImageMetadata {
  const m = posterFiles[`../assets/media/posters/${name}.jpg`];
  if (!m) throw new Error(`Missing poster: ${name}.jpg`);
  return m.default;
}
const video = (file: string, ratio: VideoRatio, folder = 'celebrities') => ({
  src: `/media/${folder}/${file}.mp4`,
  poster: poster(file),
  ratio,
});

export const celebCategories = ['singer', 'actor', 'rapper', 'tv-host', 'influencer', 'model', 'athlete', 'other', 'unknown'] as const;
export type CelebCategory = (typeof celebCategories)[number];
type VideoRatio = '9/16' | '3/4' | '1/1' | '16/9';

export interface Celebrity {
  id: string;
  name: string | null;
  category: CelebCategory;
  photos: ImageMetadata[];
  videos: { src: string; poster: ImageMetadata; ratio: VideoRatio }[];
  home?: 1 | 2 | 3 | 4;
  source: string;
}

type Entry = Omit<Celebrity, 'photos' | 'videos'> & { videos?: Celebrity['videos']; photos?: ImageMetadata[] };

const entries: Entry[] = [
  // Singers
  { id: 'lepa-brena', name: 'Lepa Brena', category: 'singer', home: 1, source: 'lepabrena_singer3, lepabrena_singer2, lepa_brena_singer' },
  {
    id: 'dragana-mirkovic', name: 'Dragana Mirković', category: 'singer',
    videos: [video('dragana-mirkovic', '9/16')],
    source: 'draganamirkovic_singer, dragana_mirkovic_singer4, draganamirkovic_singer1, draganamirkovic2_singer.mov',
  },
  {
    id: 'breskvica', name: 'Breskvica', category: 'singer', home: 4,
    videos: [video('breskvica', '16/9'), video('breskvica-2', '16/9'), video('breskvica-usce', '1/1')],
    source: 'breskvica1, breskvica_singer3, breskvica.mp4, breskvica_singer.mov, breskvica_singer1.mov (Ušće)',
  },
  {
    id: 'angelina', name: 'Angelina', category: 'singer',
    videos: [video('angelina', '16/9', 'worn-by')],
    source: 'angelina_singer, angelina_singer2, angelina_singer3, poznati/angelina_1.mp4',
  },
  {
    id: 'milica-pavlovic', name: 'Milica Pavlović', category: 'singer', photos: [poster('milica-pavlovic')],
    videos: [video('milica-pavlovic', '9/16', 'worn-by')],
    source: 'poznati/milica_pavlovic.mov',
  },
  {
    id: 'dara-bubamara', name: 'Dara Bubamara', category: 'singer', photos: [poster('dara-bubamara')],
    videos: [video('dara-bubamara', '16/9', 'worn-by')],
    source: 'poznati/dara_bubaamara.mp4',
  },
  { id: 'lena-kovacevic', name: 'Lena Kovačević', category: 'singer', source: 'lena_kovacevic_singer, lena_kovacevic2_singer, lenaKovacevic_singer3' },
  { id: 'lena-stamenkovic', name: 'Lena Stamenković', category: 'singer', source: 'lena_stamenkovic_singer, lena_stamenkovic_singer5' },
  {
    id: 'katarina-grujic', name: 'Katarina Grujić', category: 'singer',
    videos: [video('katarina-grujic', '9/16'), video('katarina-grujic-2', '9/16')],
    source: 'katarina_grujic_singer5.mp4, katarina_grujic_singer, katarina_grujic_singer2.mp4',
  },
  {
    id: 'sandra-afrika', name: 'Sandra Afrika', category: 'singer', photos: [poster('sandra-afrika')],
    videos: [video('sandra-afrika', '9/16')],
    source: 'sandraafrika1_singer.mov',
  },
  {
    id: 'ema-radujko', name: 'Ema Radujko', category: 'singer',
    videos: [video('ema-radujko', '1/1')],
    source: 'emaradujko_singer.mov',
  },
  {
    id: 'tea-tairovic', name: 'Tea Tairović', category: 'singer',
    videos: [video('tea-tairovic', '9/16')],
    source: 'tea_tairovic_singer.mov',
  },

  // Actors
  { id: 'jelena-gavrilovic', name: 'Jelena Gavrilović', category: 'actor', home: 2, source: 'jelena_gavrilovic_actress2, jelena_gavrilovic' },

  // Rappers
  {
    id: 'sajsi-mc', name: 'Sajsi MC', category: 'rapper', home: 3,
    videos: [video('sajsi-mc', '3/4')],
    source: 'sajsi_mc_rapper.mp4, sajsi_mc_rapper1.mp4',
  },

  // Not named yet: the client needs to tell us who these are and what they do.
  { id: 'p06', name: null, category: 'unknown', source: 'image00372' },
  { id: 'p02', name: null, category: 'unknown', source: 'image00110' },
  { id: 'p04', name: null, category: 'unknown', source: 'image00289' },
  { id: 'p07', name: null, category: 'unknown', source: 'image00377' },
];

export const celebrities: Celebrity[] = entries.map((e) => {
  const list = e.photos ?? photos(e.id);
  if (list.length === 0) throw new Error(`No photos for celebrity "${e.id}"`);
  return { ...e, photos: list, videos: e.videos ?? [] };
});

/** Groups in display order, only categories that have people. */
export function celebrityGroups() {
  return celebCategories
    .map((category) => ({ category, people: celebrities.filter((c) => c.category === category) }))
    .filter((g) => g.people.length > 0);
}

export const homeCelebrities = () =>
  celebrities.filter((c) => c.home).sort((a, b) => (a.home ?? 0) - (b.home ?? 0));
