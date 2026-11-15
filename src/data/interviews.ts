/**
 * Danijela's TV and podcast appearances (YouTube), shown on /press/ newest first.
 *
 * Title, channel, date and length are copied from YouTube (Nov 2026); titles stay in Serbian as published.
 * Thumbnails: src/assets/media/interviews/<youtube id>.jpg (YouTube's own thumbnail, cropped to 16:9, 960px).
 * Adding one = add the thumbnail file + a line here. The player (youtube-nocookie.com) loads only on click.
 */
const thumbs = import.meta.glob<{ default: ImageMetadata }>('../assets/media/interviews/*.jpg', { eager: true });

export interface Interview {
  id: string;
  title: string;
  channel: string;
  /** Upload date on YouTube, YYYY-MM-DD */
  date: string;
  /** Length in seconds */
  length: number;
  thumb: ImageMetadata;
}

const list: Omit<Interview, 'thumb'>[] = [
  { id: 'y0ekcGSDv7U', title: 'Danijela Jonović – KATRIEL: „Esencija” jedne žene', channel: 'tlHub Podcast', date: '2026-09-25', length: 3339 },
  { id: 'Beve1FJ4nzw', title: 'NGTJT – Gošća: Danijela Jonović (Katriel Accessories)', channel: 'Red TV', date: '2026-09-15', length: 935 },
  { id: 'quFUE3a9pDU', title: 'Prodajem emociju, a ne proizvod! | Lela Katriel Ep. 07', channel: 'Milan Knez', date: '2026-09-11', length: 3128 },
  { id: 'C8dffk-lwh0', title: 'Zanat kojem vreme ne može ništa! Kako nastaje unikatni nakit? | Zanatlije', channel: 'HYPE TV', date: '2026-09-03', length: 1289 },
  { id: 'lQxAyUz_hMk', title: 'Dizajnerka otkriva: Ovakav NAKIT svi primećuju, a rad sa ovom pevačicom je ostvarenje svih snova', channel: 'Srećne', date: '2026-04-15', length: 1243 },
  { id: '6eZoogTJrtE', title: '„Dragana Mirković mi je otvorila mnoga vrata!” Danijela Jonović', channel: 'HYPE TV', date: '2025-12-29', length: 1501 },
  { id: 'd9D9H1S-IEk', title: 'Vikend Vibe – gošća: Danijela Jonović', channel: 'Red TV', date: '2025-12-20', length: 2240 },
  { id: 'IjLfYNVmnYo', title: 'Beograde, dobro jutro – Danijela Jonović', channel: 'TV Studio B', date: '2025-12-12', length: 997 },
  { id: 'B2IspNO5aGw', title: '„Biram sebe” je naziv nove kolekcije dizajnerke Danijele Jonović', channel: 'Pink World News', date: '2024-02-14', length: 1257 },
  { id: 'DTjqW5x06SE', title: 'Kako se Stefan Subotić transformiše u poznate ličnosti? Kako nastaje magija make-up-a?', channel: 'HYPE TV', date: '2023-07-06', length: 2673 },
  { id: 'DMKQY5L_4UA', title: 'Danijela Jonović – Od hobija do posla, put ka uspehu, Katriel accessories | Priče u nama, Ep. 15', channel: 'Priče u nama – Podcast', date: '2023-02-06', length: 5485 },
  { id: 'A9GdGwCizDE', title: 'Danijela Lela Jonović – revija za pamćenje', channel: 'Pink World News', date: '2022-11-07', length: 1237 },
  { id: 'HYj_FRsgSUA', title: 'Svaka žena je princeza – Danijela Jonović', channel: 'Zasijaj uz Shine', date: '2022-07-09', length: 1541 },
  { id: 'aH9fhpsGpGk', title: 'Zornjak – gost Danijela Jonović', channel: 'Red TV', date: '2021-10-01', length: 688 },
  { id: 'yhQzaWk1VPM', title: 'Danijela Jonović, dizajnerka nakita javnih ličnosti', channel: 'Pink World News', date: '2020-11-06', length: 524 },
];

export const interviews: Interview[] = list
  .map((v) => {
    const m = thumbs[`../assets/media/interviews/${v.id}.jpg`];
    if (!m) throw new Error(`Missing interview thumbnail: ${v.id}.jpg`);
    return { ...v, thumb: m.default };
  })
  .sort((a, b) => b.date.localeCompare(a.date));
