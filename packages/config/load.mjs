// Единственная точка чтения конфига ветки.
// Каркас НИЧЕГО не знает про конкретный комплекс, район или бренд:
// всё уникальное приходит отсюда.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Корень репозитория.
 *
 * Считать его от import.meta.url нельзя: Vite инлайнит этот модуль в бандл,
 * и после сборки путь указывает внутрь dist/. Поэтому идём вверх от cwd до
 * package.json фабрики, а на файл рядом опираемся только как на запасной вариант.
 */
function findRoot() {
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    const pkg = join(dir, 'package.json');
    if (existsSync(pkg)) {
      try {
        if (JSON.parse(readFileSync(pkg, 'utf8')).name === 'landing-factory') return dir;
      } catch {
        // битый package.json по пути наверх — просто идём выше
      }
    }
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

export const ROOT = findRoot();
export const LANDINGS_DIR = join(ROOT, 'landings');
export const PACKAGES_DIR = join(ROOT, 'packages');

/** Плейсхолдер для незаполненных фактов. Никогда не выдумываем цифры. */
export const MISSING = '[ДАННЫЕ]';

/** Все каталоги лендингов в текущей ветке. */
export function listLandings() {
  if (!existsSync(LANDINGS_DIR)) return [];
  return readdirSync(LANDINGS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/**
 * Активный slug. Приоритет:
 *   1. LANDING_SLUG из окружения
 *   2. единственный не-_example каталог в ветке (обычный случай landings/<slug>)
 *   3. _example
 */
export function activeSlug(env = process.env) {
  if (env.LANDING_SLUG) return env.LANDING_SLUG;
  const real = listLandings().filter((s) => s !== '_example');
  if (real.length === 1) return real[0];
  if (real.length > 1) {
    throw new Error(
      `В ветке ${real.length} лендингов (${real.join(', ')}). Одна ветка = один домен. ` +
        `Задайте LANDING_SLUG явно или разнесите лендинги по веткам.`
    );
  }
  return '_example';
}

export function landingDir(slug = activeSlug()) {
  return join(LANDINGS_DIR, slug);
}

/** Читает config.json ветки. Без нормализации — сырой объект. */
export function readConfig(slug = activeSlug()) {
  const file = join(landingDir(slug), 'config.json');
  if (!existsSync(file)) throw new Error(`Нет конфига: ${file}`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

/**
 * Конфиг + удобные производные поля для шаблона.
 * Пустые коммерческие поля НЕ выдумываются: остаются пустыми,
 * шаблон сам решает — показать [ДАННЫЕ] или схлопнуть блок.
 */
export function loadLanding(slug = activeSlug()) {
  const cfg = readConfig(slug);
  const origin = (cfg.origin || '').replace(/\/$/, '');
  return {
    ...cfg,
    slug: cfg.slug || slug,
    origin,
    canonical: origin ? `${origin}/` : '',
    isProdDomain: Boolean(cfg.domain && origin),
  };
}

/** Значение или [ДАННЫЕ]. Для полей, которые обязаны быть видимы. */
export function fact(value) {
  const v = typeof value === 'string' ? value.trim() : value;
  return v === undefined || v === null || v === '' ? MISSING : v;
}

/** Есть ли реальное значение — для схлопывания необязательных блоков. */
export function has(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim() !== '';
  return value !== undefined && value !== null;
}
