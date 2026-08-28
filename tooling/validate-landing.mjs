#!/usr/bin/env node
// Гейт перед сборкой. Не пропускает ветку, в которой лендинг не готов к домену.
//
//   node tooling/validate-landing.mjs [--slug <slug>] [--prod]
//
// --prod включает требования, которые нужны только на боевом домене:
// заполненный domain/origin и отсутствие [ДАННЫЕ] в видимых полях.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

import { ROOT, listLandings, landingDir, readConfig, activeSlug, MISSING } from '../packages/config/load.mjs';
import { loadPreset } from '../packages/quiz/load-preset.mjs';
import { findForbidden, collectStrings } from './forbidden.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const PROD = flag('prod') || process.env.LANDING_ENV === 'production';
const slug = opt('slug') || activeSlug();

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

// ---------- 1. Схема конфига ----------
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const landingSchema = JSON.parse(readFileSync(join(ROOT, 'schemas/landing.schema.json'), 'utf8'));
const quizSchema = JSON.parse(readFileSync(join(ROOT, 'schemas/quiz.schema.json'), 'utf8'));

let config;
try {
  config = readConfig(slug);
} catch (e) {
  console.error(`✗ ${e.message}`);
  process.exit(1);
}

const validateLanding = ajv.compile(landingSchema);
if (!validateLanding(config)) {
  for (const e of validateLanding.errors ?? []) {
    fail(`схема: ${e.instancePath || '$'} ${e.message}`);
  }
}

// ---------- 2. Обязательный минимум страницы ----------
if (!config.type) fail('не задан type (area | audience | project | scenario | compare)');
if (!config.language) fail('не задан language');
if (!config.seo?.h1?.trim()) fail('пустой seo.h1');
if (!config.insight?.strike?.trim()) fail('Разбор без удара (insight.strike)');
if (!config.insight?.body?.trim()) fail('Разбор без расшифровки (insight.body)');

const faqCount = (config.faq ?? []).length;
if (faqCount < 4) fail(`FAQ: ${faqCount} из минимум 4`);

const explainCount = (config.explanations ?? []).length;
if (explainCount < 3) fail(`Разъяснения: ${explainCount} из минимум 3`);

// ---------- 3. Разбор: анатомия ----------
if (config.insight?.strike) {
  const n = words(config.insight.strike);
  if (n < 12 || n > 22) fail(`Разбор: удар ${n} слов, нужно 12–22`);
}
if (config.insight?.body) {
  const sentences = config.insight.body.split(/[.!?…]+\s/).filter((s) => s.trim().length > 1).length;
  if (sentences < 2 || sentences > 4) {
    warn(`Разбор: расшифровка ${sentences} предложения, по канону 2–4`);
  }
}

// ---------- 3a. Фонарь: оффер ----------
// Срочность и дефицит живут только здесь и только с источником и датой.
// Протухшая дата роняет сборку: живой домен не должен показывать старую акцию.
const offer = config.fonar;

if (!offer || !offer.headline?.trim()) {
  warn('Фонарь (оффер) не заполнен — блок схлопнется. Для type=project это почти всегда ошибка.');
} else {
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  const checkDate = (iso, where) => {
    const d = new Date(`${iso}T23:59:59`);
    if (Number.isNaN(d.getTime())) {
      fail(`Фонарь: ${where}.validUntil «${iso}» — не дата в формате ГГГГ-ММ-ДД`);
      return;
    }
    const daysLeft = Math.ceil((d.getTime() - TODAY.getTime()) / 86_400_000);
    if (daysLeft < 0) {
      fail(`Фонарь: ${where}.validUntil ${iso} уже прошла. Обновите оффер или уберите блок.`);
    } else if (daysLeft <= 3) {
      warn(`Фонарь: ${where} истекает через ${daysLeft} дн. — блок скоро скроется сам`);
    }
  };

  if (offer.price?.value?.trim() && !offer.price?.source?.trim()) {
    fail('Фонарь: цена без price.source. Кто и когда её подтвердил?');
  }
  if (offer.price?.validUntil) checkDate(offer.price.validUntil, 'price');

  if (offer.scarcity) {
    if (!offer.scarcity.source?.trim()) {
      fail('Фонарь: scarcity без источника — это фейковый дефицит');
    }
    if (!offer.scarcity.validUntil) {
      fail('Фонарь: scarcity без validUntil — остаток протухнет и никто не заметит');
    } else {
      checkDate(offer.scarcity.validUntil, 'scarcity');
    }
    if (typeof offer.scarcity.remaining === 'number' && offer.scarcity.remaining === 0) {
      fail('Фонарь: scarcity.remaining = 0. Оффер, которого больше нет, показывать нельзя.');
    }
  }

  if (offer.deadline) {
    if (!offer.deadline.source?.trim()) fail('Фонарь: deadline без источника');
    if (!offer.deadline.validUntil) {
      fail('Фонарь: deadline без validUntil');
    } else {
      checkDate(offer.deadline.validUntil, 'deadline');
    }
  }

  if (offer.deadline?.showCountdown && !offer.deadline?.validUntil) {
    fail('Фонарь: showCountdown без deadline.validUntil — обратный отсчёт не к чему привязать');
  }
}

// ---------- 4. Разбор уникален между ветками ----------
// Уникальность нужна именно разбору: это он кормит органику.
// Оффер может повторяться (одна акция застройщика на нескольких доменах) — только предупреждаем.
const normalize = (s) => String(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
if (config.insight?.strike) {
  const mine = normalize(config.insight.strike);
  const myOffer = normalize(config.fonar?.headline ?? '');

  for (const other of listLandings()) {
    if (other === slug) continue;
    const file = join(landingDir(other), 'config.json');
    if (!existsSync(file)) continue;
    const otherCfg = JSON.parse(readFileSync(file, 'utf8'));

    if (otherCfg.insight?.strike && normalize(otherCfg.insight.strike) === mine) {
      fail(`Разбор совпадает с landings/${other}: один удар не может стоять на двух доменах`);
    }
    if (myOffer && otherCfg.fonar?.headline && normalize(otherCfg.fonar.headline) === myOffer) {
      warn(`оффер Фонаря совпадает с landings/${other} — убедитесь, что это одна и та же акция`);
    }
  }
}

// ---------- 5. Копирайт-правила ----------
const title = config.seo?.title?.trim() ?? '';
const description = config.seo?.description?.trim() ?? '';

if (title && (title.length < 50 || title.length > 65)) {
  warn(`title ${title.length} знаков, канон 50–65`);
}
if (description && (description.length < 140 || description.length > 160)) {
  warn(`description ${description.length} знаков, канон 140–160`);
}

const brandName = config.brand?.name?.trim();
if (brandName && config.seo?.h1?.toLowerCase().includes(brandName.toLowerCase())) {
  fail('бренд в H1: бренд допустим только в title после пайпа');
}

// ---------- 6. Перелинковка ----------
const neighbors = config.neighbors ?? [];
if (neighbors.length > 0 && (neighbors.length < 2 || neighbors.length > 5)) {
  warn(`соседних доменов ${neighbors.length}, канон 2–5`);
}
for (const n of neighbors) {
  if (/^(подробнее|здесь|тут|читать далее)$/i.test(String(n.label).trim())) {
    fail(`анкор «${n.label}» не описывает интент соседа`);
  }
  if (config.origin && n.href?.startsWith(config.origin)) {
    fail(`сосед ${n.href} ведёт на свой же домен — это не перелинковка`);
  }
}

// ---------- 7. Запрещённые утверждения ----------
for (const hit of findForbidden(config, config.forbiddenClaims ?? [])) {
  fail(`запрет [${hit.id}] в ${hit.path}: «${hit.match}» — ${hit.why}`);
}

// ---------- 8. Квиз ----------
let preset;
try {
  preset = loadPreset(slug, config.quizPreset);
} catch (e) {
  fail(`пресет квиза не читается: ${e.message}`);
}

if (preset) {
  const validateQuiz = ajv.compile(quizSchema);
  if (!validateQuiz(preset)) {
    for (const e of validateQuiz.errors ?? []) {
      fail(`квиз: ${e.instancePath || '$'} ${e.message}`);
    }
  }

  // Каждое правило маршрутизации должно ссылаться на существующие шаги и ответы.
  const stepIds = new Set((preset.steps ?? []).map((s) => s.id));
  for (const rule of preset.routing ?? []) {
    for (const [stepId, allowed] of Object.entries(rule.when)) {
      if (!stepIds.has(stepId)) {
        fail(`квиз: правило маршрута ${rule.route} ссылается на несуществующий шаг «${stepId}»`);
        continue;
      }
      const step = preset.steps.find((s) => s.id === stepId);
      const optionIds = new Set(step.options.map((o) => o.id));
      for (const a of allowed) {
        if (!optionIds.has(a)) {
          fail(`квиз: правило ${rule.route} ждёт ответ «${a}», которого нет в шаге «${stepId}»`);
        }
      }
    }
  }

  // Маршрут neighbor без исходящей ссылки бесполезен.
  if (preset.routes?.neighbor && !preset.routes.neighbor.outboundHref) {
    warn('квиз: маршрут neighbor без outboundHref — человеку некуда уйти');
  }
}

// ---------- 9. Требования боевого домена ----------
if (PROD) {
  if (!config.domain?.trim()) fail('прод: пустой domain');
  if (!config.origin?.trim()) fail('прод: пустой origin');
  if (config.origin && !/^https:\/\//.test(config.origin)) fail('прод: origin должен быть https');

  const placeholders = collectStrings(config).filter(
    (s) => s.value.includes(MISSING) && !s.path.startsWith('$.forbiddenClaims')
  );
  for (const p of placeholders) {
    fail(`прод: незаполненный ${MISSING} в ${p.path}`);
  }
} else if (!config.domain?.trim()) {
  warn('domain пустой — сборка пойдёт как превью, robots закроет индексацию');
}

// ---------- Отчёт ----------
const label = `landings/${slug}`;
for (const w of warnings) console.warn(`  ! ${w}`);

if (errors.length > 0) {
  console.error(`\n✗ ${label}: ${errors.length} блокирующих замечаний${PROD ? ' (режим прода)' : ''}`);
  for (const e of errors) console.error(`  – ${e}`);
  console.error('');
  process.exit(1);
}

console.log(
  `✓ ${label}: конфиг валиден${PROD ? ', готов к домену' : ' (превью)'}` +
    (warnings.length ? `, замечаний: ${warnings.length}` : '')
);
