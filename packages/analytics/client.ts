// Клиентская обвязка: один слушатель на все data-event, плюс track() для движка квиза.
import { createAnalytics, type AnalyticsProvider } from './adapter';

let provider: AnalyticsProvider = createAnalytics('none');

export function initAnalytics(providerName: string) {
  provider = createAnalytics(providerName);

  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-event]');
    if (!el) return;
    provider.track(el.dataset.event!, { label: el.dataset.eventLabel ?? null });
  });
}

export function track(event: string, payload?: Record<string, unknown>) {
  provider.track(event, payload);
}
