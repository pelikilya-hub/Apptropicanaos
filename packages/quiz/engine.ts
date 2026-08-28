// Движок квиза. Общий для всех доменов; ветка даёт только пресет.
//
// Принцип: квиз квалифицирует и ведёт. Сначала маршрут, потом контакт.
// Назад — без потери ответов. Состояние в localStorage. Закончить можно анонимно.
import type { Answers, QuizPreset, RouteId } from './types';

export interface QuizState {
  step: number;
  answers: Answers;
  done: boolean;
}

const EMPTY: QuizState = { step: 0, answers: {}, done: false };

export function storageKey(slug: string) {
  return `quiz:${slug}`;
}

export function loadState(slug: string): QuizState {
  if (typeof localStorage === 'undefined') return { ...EMPTY };
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<QuizState>;
    return {
      step: typeof parsed.step === 'number' ? parsed.step : 0,
      answers: parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {},
      done: Boolean(parsed.done),
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveState(slug: string, state: QuizState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    // Приватный режим или переполнение — квиз обязан работать и без хранилища.
  }
}

export function clearState(slug: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(storageKey(slug));
  } catch {
    /* см. saveState */
  }
}

/**
 * Маршрут по ответам. Правила проверяются по порядку, первое совпадение выигрывает,
 * поэтому в пресете более специфичные правила ставятся выше.
 */
export function resolveRoute(preset: QuizPreset, answers: Answers): RouteId {
  for (const rule of preset.routing) {
    const matches = Object.entries(rule.when).every(([stepId, allowed]) => {
      const given = answers[stepId];
      return given !== undefined && allowed.includes(given);
    });
    if (matches) return rule.route;
  }
  return preset.fallbackRoute;
}

/** Сколько шагов реально отвечено — для прогресса и события quiz_step. */
export function answeredCount(preset: QuizPreset, answers: Answers): number {
  return preset.steps.filter((s) => answers[s.id] !== undefined).length;
}

export function isComplete(preset: QuizPreset, answers: Answers): boolean {
  return answeredCount(preset, answers) === preset.steps.length;
}
