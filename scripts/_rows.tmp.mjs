import sharp from 'sharp';
import { readdirSync } from 'node:fs';
const [,, dir, out, from, to] = process.argv;
const files = readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
const ids = [...new Set(files.map(f => f.split('_')[0]))].filter(id => +id >= +from && +id <= +to);
const H = 200, rowH = H + 4, labelW = 40;
const comps = []; let maxW = 0;
for (const [r, id] of ids.entries()) {
  let x = labelW;
  comps.push({ input: Buffer.from(`<svg width="${labelW}" height="${H}"><rect width="100%" height="100%" fill="black"/><text x="4" y="30" font-size="22" fill="white" font-family="Arial">${id}</text></svg>`), left: 0, top: r * rowH });
  for (const f of files.filter(f => f.startsWith(id + '_'))) {
    const buf = await sharp(`${dir}/${f}`).resize({ height: H }).toBuffer();
    const { width } = await sharp(buf).metadata();
    comps.push({ input: buf, left: x, top: r * rowH }); x += width + 4;
  }
  maxW = Math.max(maxW, x);
}
await sharp({ create: { width: maxW, height: ids.length * rowH, channels: 3, background: '#fff' } }).composite(comps).jpeg({ quality: 78 }).toFile(out);
console.log(out, maxW);
