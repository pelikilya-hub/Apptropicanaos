#!/usr/bin/env node
// Приводит загруженные кадры к весу, пригодному для страницы.
//
//   node tooling/optimize-media.mjs --slug <slug> [--max 2400] [--quality 82] [--keep]
//
// Из sales kit'ов приходят исходники по 5–12 МБ: на мобильном интернете такая
// страница не открывается. Переводим в WebP с ограничением по ширине.
// Оригиналы остаются у застройщика — в репозитории лежат рабочие копии,
// поэтому по умолчанию исходник заменяется. --keep оставляет его рядом.
//
// Запускать ДО import-media: импортёр должен увидеть уже готовые файлы.
import { readdirSync, existsSync, statSync, unlinkSync } from 'node:fs';
import { join, extname, dirname, basename } from 'node:path';
import sharp from 'sharp';
import { landingDir, activeSlug } from '../packages/config/load.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};
const slug = opt('slug', activeSlug());
const maxWidth = Number(opt('max', 2400));
const quality = Number(opt('quality', 82));
const keep = args.includes('--keep');

const SOURCE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const pub = join(landingDir(slug), 'public');

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return SOURCE.has(extname(e.name).toLowerCase()) ? [full] : [];
  });
}

const files = [...walk(join(pub, 'media')), ...walk(join(pub, 'plans'))];

if (files.length === 0) {
  console.error(`✗ в landings/${slug}/public нет изображений в media/ или plans/`);
  process.exit(1);
}

const kb = (n) => `${Math.round(n / 1024)} КБ`;
let before = 0;
let after = 0;
let touched = 0;

console.log(`\n▸ ${slug}: ${files.length} файлов, ширина до ${maxWidth}px, качество ${quality}\n`);

for (const file of files) {
  const src = statSync(file).size;
  before += src;

  const meta = await sharp(file).metadata();
  const target = join(dirname(file), `${basename(file, extname(file))}.webp`);
  const alreadyWebp = extname(file).toLowerCase() === '.webp';

  // Файл уже в WebP, укладывается в ширину и весит меньше 400 КБ — не трогаем.
  if (alreadyWebp && meta.width <= maxWidth && src < 400 * 1024) {
    after += src;
    console.log(`  = ${basename(file).padEnd(28)} ${kb(src)} — оставлен как есть`);
    continue;
  }

  await sharp(file)
    .rotate() // уважаем EXIF-ориентацию: без этого портретные кадры лягут боком
    .resize({ width: Math.min(meta.width, maxWidth), withoutEnlargement: true })
    .webp({ quality, effort: 5 })
    .toFile(`${target}.tmp`);

  const { renameSync } = await import('node:fs');
  renameSync(`${target}.tmp`, target);

  if (!keep && file !== target) unlinkSync(file);

  const out = statSync(target).size;
  after += out;
  touched++;
  const w = Math.min(meta.width, maxWidth);
  console.log(
    `  → ${basename(target).padEnd(28)} ${meta.width}px ${kb(src)}  →  ${w}px ${kb(out)}`
  );
}

const saved = before - after;
console.log(
  `\n✓ обработано ${touched} из ${files.length}: ${kb(before)} → ${kb(after)}` +
    (saved > 0 ? ` (минус ${Math.round((saved / before) * 100)}%)` : '')
);
console.log(keep ? '  Исходники оставлены рядом (--keep).\n' : '  Исходники заменены.\n');
console.log('  Дальше: npm run import:media -- --slug ' + slug + ' --write\n');
