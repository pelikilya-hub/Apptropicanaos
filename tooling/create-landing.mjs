#!/usr/bin/env node
// main -> ветка + каркас конфига. Скрипт НЕ придумывает коммерческие факты
// и НЕ деплоит. Дальше конфиг заполняет человек или редактор.
//
//   npm run new:landing -- --slug area-kata-family --type area
import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, LANDINGS_DIR, listLandings } from '../packages/config/load.mjs';

const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (n) => args.includes(`--${n}`);

const slug = opt('slug');
const type = opt('type');
const noBranch = flag('no-branch');

const TYPES = ['area', 'audience', 'project', 'scenario', 'compare'];

// Какие поля обязательны для каждого типа — скрипт скажет это в конце.
const REQUIRED_BY_TYPE = {
  area: ['geo.district', 'geo.anchors (3+)', 'audienceFit.forWhom / notForWhom'],
  audience: ['audience', 'audienceFit.forWhom / notForWhom', 'propertyTypes'],
  project: ['product.name', 'product.developer', 'product.stage', 'units[] (или «по запросу»)'],
  scenario: ['intent', 'explanations[] по механике сделки', 'afterKeys (если сервис есть)'],
  compare: ['comparison.left', 'comparison.right', 'comparison.rows (4+)'],
};

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

if (!slug) die('нужен --slug, например: --slug area-kata-family');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) die(`slug «${slug}»: только a-z, 0-9 и дефис`);
if (!type) die(`нужен --type: ${TYPES.join(' | ')}`);
if (!TYPES.includes(type)) die(`неизвестный type «${type}». Доступные: ${TYPES.join(', ')}`);

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();

// 1. main должен быть чистым.
if (!noBranch) {
  let status;
  try {
    status = git('status', '--porcelain');
  } catch {
    die('это не git-репозиторий');
  }
  if (status) die('рабочее дерево грязное. Закоммитьте или спрячьте изменения перед созданием ветки.');
}

const branch = `landings/${slug}`;
const target = join(LANDINGS_DIR, slug);

if (existsSync(target)) die(`landings/${slug} уже существует`);

// 2. Каркас из _example.
const example = join(LANDINGS_DIR, '_example');
if (!existsSync(example)) die('нет шаблона landings/_example');

mkdirSync(target, { recursive: true });
cpSync(example, target, { recursive: true });

// 3. Черновик конфига: технические поля заполнены, коммерческие — пустые.
const cfgPath = join(target, 'config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));

cfg.slug = slug;
cfg.type = type;
cfg.domain = '';
cfg.origin = '';
cfg.seo = { title: '', description: '', h1: '' };
cfg.fonar = { ...cfg.fonar, strike: '', body: '', splitYes: '', splitNo: '' };
cfg.hero = { ...cfg.hero, eyebrow: '', lead: '' };
cfg.faq = [];
cfg.explanations = [];
cfg.neighbors = [];
cfg.units = [];
cfg.brand = { name: '', homeLabel: '', logoAlt: '' };
cfg.product = { name: '', developer: '', stage: '', completion: '', unitRange: '', entryPrice: '', pricePerSqm: '' };

writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

// 4. Ветка.
if (!noBranch) {
  git('checkout', '-b', branch);
}

console.log(`\n✓ создано: landings/${slug}  (type: ${type})`);
console.log(noBranch ? '  ветка не создана (--no-branch)' : `  ветка: ${branch}`);
console.log('\nОбязательно заполнить для этого типа:');
for (const f of REQUIRED_BY_TYPE[type]) console.log(`  – ${f}`);
console.log('\nОбщий минимум для любой ветки:');
console.log('  – seo.title / seo.description / seo.h1');
console.log('  – fonar.strike (12–22 слова, уникален среди всех веток) + fonar.body');
console.log('  – 4+ FAQ, 3+ разъяснения');
console.log('  – 2–5 neighbors с анкорами по интенту');
console.log('  – domain / origin — только когда домен реально назначен');
console.log(`\nЧего в репозитории ещё нет: ${listLandings().length} лендинг(ов) в этой ветке.`);
console.log('\nДальше: заполнить конфиг -> npm run validate:landing -> npm run build');
console.log('Деплой скрипт не делает.\n');
