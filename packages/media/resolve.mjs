// Разрешение медиа ветки: путь из конфига -> файл в public/ + его размеры.
// Компоненты не лезут в файловую систему сами, это делает один модуль.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { landingDir, activeSlug } from '../config/load.mjs';
import { imageSize } from './dimensions.mjs';

/** Абсолютный путь к файлу, на который ссылается запись медиа. */
export function publicPath(src, slug = activeSlug()) {
  return join(landingDir(slug), 'public', src.replace(/^\//, ''));
}

export function exists(src, slug = activeSlug()) {
  return existsSync(publicPath(src, slug));
}

/**
 * Запись изображения с размерами. Отсутствующий файл не роняет рендер:
 * его ловит валидатор на сборке, а компонент просто отдаёт запись без размеров.
 */
export function resolveImage(item, slug = activeSlug()) {
  const file = publicPath(item.src, slug);
  const size = existsSync(file) ? imageSize(file) : null;
  return { ...item, width: size?.width, height: size?.height, missing: !existsSync(file) };
}

export function resolveAll(items = [], slug = activeSlug()) {
  return items.map((i) => resolveImage(i, slug));
}
