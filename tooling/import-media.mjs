#!/usr/bin/env node
// Собирает блок media из файлов, которые уже лежат в public/ ветки.
//
//   node tooling/import-media.mjs --slug <slug>            показать
//   node tooling/import-media.mjs --slug <slug> --write     вписать в config.json
//
// Где что ищем:
//   public/media/**   -> gallery
//   public/plans/<тип>/**  или  public/plans/<тип>-*.jpg  -> planы, сгруппированные по типу
//
// alt не выдумывается: каждому кадру проставляется [ДАННЫЕ], и заполнить
// его должен человек. Прод-валидация такие подписи не пропустит.
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, extname, basename, relative, sep } from 'node:path';
import { landingDir, activeSlug, MISSING } from '../packages/config/load.mjs';
import { imageSize } from '../packages/media/dimensions.mjs';

const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const slug = opt('slug') || activeSlug();
const write = args.includes('--write');

const IMAGE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const pub = join(landingDir(slug), 'public');

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return walk(full);
    return IMAGE.has(extname(e.name).toLowerCase()) ? [full] : [];
  });
}

/** Путь для конфига: от public/ и всегда со слешем впереди. */
const toSrc = (file) => '/' + relative(pub, file).split(sep).join('/');

const human = (file) =>
  basename(file, extname(file)).replace(/[-_]+/g, ' ').trim();

const gallery = walk(join(pub, 'media'))
  .sort()
  .map((file) => {
    const size = imageSize(file);
    return {
      src: toSrc(file),
      alt: `${MISSING} — что на кадре: ${human(file)}`,
      ...(size ? { _размер: `${size.width}×${size.height}` } : { _размер: 'не распознан' }),
    };
  });

// Планировки группируются по подкаталогу, а если его нет — по префиксу имени до дефиса.
const planFiles = walk(join(pub, 'plans')).sort();
const groups = new Map();

for (const file of planFiles) {
  const rel = relative(join(pub, 'plans'), file).split(sep);
  const unit = rel.length > 1 ? rel[0] : basename(file).split(/[-_]/)[0];
  if (!groups.has(unit)) groups.set(unit, []);
  const size = imageSize(file);
  groups.get(unit).push({
    src: toSrc(file),
    alt: `${MISSING} — планировка: ${human(file)}`,
    label: human(file),
    ...(size ? { _размер: `${size.width}×${size.height}` } : { _размер: 'не распознан' }),
  });
}

const plans = [...groups.entries()].map(([unit, sheets]) => ({
  unit,
  label: `${MISSING} — название типа «${unit}»`,
  sheets,
}));

const media = {
  ...(gallery.length ? { gallery } : {}),
  ...(plans.length ? { plans } : {}),
};

if (gallery.length === 0 && plans.length === 0) {
  console.error(`✗ в landings/${slug}/public не найдено изображений`);
  console.error('  Ожидается: public/media/** для галереи, public/plans/<тип>/** для планировок');
  process.exit(1);
}

console.log(`\n▸ ${slug}: ${gallery.length} кадров в галерее, ${plans.length} типов планировок\n`);
console.log(JSON.stringify({ media }, null, 2));

if (write) {
  const file = join(landingDir(slug), 'config.json');
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  // Служебные поля с размерами в конфиг не едут: они только для чтения глазами.
  const strip = (o) => JSON.parse(JSON.stringify(o), (k, v) => (k === '_размер' ? undefined : v));
  cfg.media = { ...(cfg.media ?? {}), ...strip(media) };
  writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`\n✓ вписано в landings/${slug}/config.json`);
  console.log(`  Заполните alt у каждого кадра: сейчас там ${MISSING}, и прод их не пропустит.\n`);
} else {
  console.log('\n  --write вписывает это в config.json\n');
}
