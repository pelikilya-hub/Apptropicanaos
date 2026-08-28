// Разрешение пресета квиза для ветки.
// Приоритет: landings/<slug>/content/quiz.json  ->  packages/quiz/presets/<name>.json  ->  base.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { landingDir, PACKAGES_DIR } from '../config/load.mjs';

// От корня репозитория, а не от import.meta.url: после сборки этот модуль
// живёт внутри бандла и своего исходного пути уже не знает.
const PRESETS = join(PACKAGES_DIR, 'quiz', 'presets');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function loadPreset(slug, presetName) {
  const branchOverride = join(landingDir(slug), 'content', 'quiz.json');
  if (existsSync(branchOverride)) return readJson(branchOverride);

  if (presetName) {
    const named = join(PRESETS, `${presetName}.json`);
    if (existsSync(named)) return readJson(named);
  }

  return readJson(join(PRESETS, 'base.json'));
}
