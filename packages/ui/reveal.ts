// Одно движение на всю страницу: блок оседает на место, когда входит в экран.
//
// Проверка идёт на каждом кадре прокрутки, а не через IntersectionObserver:
// на быстром флике наблюдатель успевает получить только «вошёл и вышел»,
// и блок остаётся невидимым, пока к нему не вернёшься. Содержимое страницы
// не имеет права зависеть от скорости пальца.
export function initReveal() {
  const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  if (!items.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('js-reveal');

  let pending = new Set(items);
  let queued = false;

  const sweep = () => {
    queued = false;
    const line = innerHeight * 0.92;
    let shown = 0;
    for (const el of [...pending]) {
      if (el.getBoundingClientRect().top < line) {
        // Соседи, попавшие в экран одновременно, появляются лесенкой.
        if (!el.style.getPropertyValue('--reveal-delay')) {
          el.style.setProperty('--reveal-delay', `${Math.min(shown, 4) * 60}ms`);
        }
        el.classList.add('is-in');
        pending.delete(el);
        shown++;
      }
    }
    if (!pending.size) removeEventListener('scroll', onScroll);
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sweep);
  };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  sweep();
}
