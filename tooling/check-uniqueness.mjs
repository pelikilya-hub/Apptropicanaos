#!/usr/bin/env node
// Аудит здоровья на многих доменах: ищет совпадения там, где их быть не должно.
// Запускать из ветки, где видны несколько landings/*, или в CI по всем веткам.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { listLandings, landingDir } from '../packages/config/load.mjs';

const normalize = (s) =>
  String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Поля, которые обязаны отличаться между доменами (п. 2.2).
const UNIQUE_FIELDS = [
  ['fonar.strike', (c) => c.fonar?.strike],
  ['seo.h1', (c) => c.seo?.h1],
  ['seo.title', (c) => c.seo?.title],
  ['seo.description', (c) => c.seo?.description],
  ['hero.lead', (c) => c.hero?.lead],
];

const configs = [];
for (const slug of listLandings()) {
  const file = join(landingDir(slug), 'config.json');
  if (existsSync(file)) configs.push({ slug, cfg: JSON.parse(readFileSync(file, 'utf8')) });
}

if (configs.length < 2) {
  console.log(`ℹ в этой ветке ${configs.length} лендинг(ов) — сравнивать не с чем.`);
  console.log('  Полный аудит имеет смысл в CI, где собраны все ветки landings/*.');
  process.exit(0);
}

let clashes = 0;

for (const [label, pick] of UNIQUE_FIELDS) {
  const seen = new Map();
  for (const { slug, cfg } of configs) {
    const v = normalize(pick(cfg));
    if (!v) continue;
    if (seen.has(v)) {
      clashes++;
      console.error(`✗ ${label} совпадает: ${seen.get(v)} и ${slug}`);
    } else {
      seen.set(v, slug);
    }
  }
}

// FAQ: одинаковые вопросы на разных доменах — признак дверных страниц.
const faqSeen = new Map();
for (const { slug, cfg } of configs) {
  for (const item of cfg.faq ?? []) {
    const q = normalize(item.q);
    if (!q) continue;
    if (faqSeen.has(q) && faqSeen.get(q) !== slug) {
      clashes++;
      console.error(`✗ FAQ «${item.q}» повторяется: ${faqSeen.get(q)} и ${slug}`);
    } else {
      faqSeen.set(q, slug);
    }
  }
}

if (clashes > 0) {
  console.error(`\n✗ ${clashes} совпадений между доменами. Дверные страницы недопустимы.\n`);
  process.exit(1);
}

console.log(`✓ ${configs.length} лендингов, пересечений в уникальных полях нет.`);
