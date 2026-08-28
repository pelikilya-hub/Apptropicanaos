export type RouteId = 'fit' | 'neighbor' | 'budget' | 'learn' | 'remote';

export interface QuizOption {
  /** Стабильный id ответа. Пресет ветки может переименовать label, но не id. */
  id: string;
  label: string;
  hint?: string;
}

export interface QuizStep {
  id: string;
  question: string;
  /** Подсказка под вопросом. Не продающая. */
  note?: string;
  options: QuizOption[];
}

export interface RouteText {
  title: string;
  body: string;
  /** Что предлагаем сделать дальше. Контакт — только отсюда. */
  ctaLabel?: string;
  ctaHref?: string;
  /** Ссылка на соседний домен для маршрута neighbor. */
  outboundLabel?: string;
  outboundHref?: string;
}

export interface RoutingRule {
  /** Маршрут, который выдаём при совпадении. */
  route: RouteId;
  /** Все условия должны совпасть: { stepId: [допустимые id ответов] }. */
  when: Record<string, string[]>;
}

export interface QuizPreset {
  name: string;
  steps: QuizStep[];
  /** Правила проверяются сверху вниз, первое совпадение выигрывает. */
  routing: RoutingRule[];
  /** Маршрут, если ни одно правило не сработало. */
  fallbackRoute: RouteId;
  routes: Record<RouteId, RouteText>;
}

export type Answers = Record<string, string>;
