// Адаптер событий. Ключи и пиксели НЕ в репозитории —
// только имена переменных окружения и имя провайдера в конфиге.

export type LandingEvent =
  | 'quiz_start'
  | 'quiz_step'
  | 'quiz_complete'
  | 'cta_click'
  | `quiz_route_${string}`;

export interface AnalyticsProvider {
  track(event: string, payload?: Record<string, unknown>): void;
}

/** Провайдер по умолчанию: ничего не отправляет наружу. */
const noopProvider: AnalyticsProvider = {
  track(event, payload) {
    if (typeof window !== 'undefined' && (window as any).__LANDING_DEBUG__) {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', event, payload ?? {});
    }
  },
};

/** dataLayer-совместимый провайдер (GTM/GA4) — подключается по конфигу. */
const dataLayerProvider: AnalyticsProvider = {
  track(event, payload) {
    if (typeof window === 'undefined') return;
    const w = window as any;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, ...(payload ?? {}) });
  },
};

const providers: Record<string, AnalyticsProvider> = {
  none: noopProvider,
  datalayer: dataLayerProvider,
};

export function createAnalytics(providerName = 'none'): AnalyticsProvider {
  return providers[providerName] ?? noopProvider;
}
