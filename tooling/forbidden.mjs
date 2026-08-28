// Системные запреты каркаса. Действуют на все ветки и не отключаются конфигом.
// Ветка может только ДОБАВИТЬ свои через config.forbiddenClaims.
export const SYSTEM_FORBIDDEN = [
  {
    id: 'superlative-market',
    re: /\b(лучш(ая|ие|ий|ее)|топ-?1|номер\s*один|самая\s+выгодная)\s+(недвижимост|инвестиц|вилл|апартамент)/i,
    why: 'Превосходная степень про рынок. Органический тон — справочник, а не оффер.',
  },
  {
    id: 'guaranteed-yield',
    re: /(гарантир\w*\s+(доход|доходност|прибыл|окупаем|аренд)|доходность\s+гарантир|guaranteed\s+(yield|roi|return))/i,
    why: 'Гарантия доходности запрещена: это обещание, которое нельзя обеспечить.',
  },
  {
    id: 'no-risk',
    re: /(без\s+риск(а|ов)|нулев(ой|ые)\s+риск|risk[-\s]?free)/i,
    why: '«Без риска» — недостоверное утверждение о сделке с недвижимостью.',
  },
  {
    id: 'fake-scarcity',
    re: /(остал(ось|ась|ись)\s+(всего\s+)?\d+|последн(яя|ие)\s+\d+\s+(вилл|лот|юнит|квартир)|успей(те)?\s+купить)/i,
    why: 'Фейковый дефицит. Если инвентарь правда ограничен — это данные из шахматки, а не лозунг.',
  },
  {
    id: 'countdown',
    re: /(таймер|обратн(ый|ого)\s+отсч[её]т|акция\s+заканчивается|только\s+сегодня|скидка\s+действует\s+до)/i,
    why: 'Таймеры и дедлайны скидок в каркасе запрещены.',
  },
  {
    id: 'grey-land-scheme',
    re: /(номинальн\w+\s+(тайск|владел|акционер)|обход\s+(закон|ограничен)|схем\w*\s+(владения\s+землёй|обхода)|подставн\w+\s+компан)/i,
    why: 'Серые схемы владения землёй не описываем. Только отправка к независимому юристу.',
  },
  {
    id: 'fake-reviews',
    re: /(наши\s+клиенты\s+уже\s+заработали|\d+\s*%\s+клиентов\s+довольн)/i,
    why: 'Отзывы и статистика клиентов без источника — выдумка.',
  },
];

/** Собирает все строковые значения объекта с путями до них. */
export function collectStrings(node, path = '$', out = []) {
  if (typeof node === 'string') {
    out.push({ path, value: node });
  } else if (Array.isArray(node)) {
    node.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) collectStrings(v, `${path}.${k}`, out);
  }
  return out;
}

/** Проверяет тексты конфига против системных и веточных запретов. */
export function findForbidden(config, extraClaims = []) {
  const strings = collectStrings(config).filter(
    // forbiddenClaims — это сам список запретов, а не текст страницы.
    (s) => !s.path.startsWith('$.forbiddenClaims')
  );

  const hits = [];

  for (const { id, re, why } of SYSTEM_FORBIDDEN) {
    for (const { path, value } of strings) {
      const m = value.match(re);
      if (m) hits.push({ id, path, match: m[0], why });
    }
  }

  for (const claim of extraClaims) {
    const needle = String(claim).trim().toLowerCase();
    if (!needle) continue;
    for (const { path, value } of strings) {
      if (value.toLowerCase().includes(needle)) {
        hits.push({
          id: 'branch-forbidden',
          path,
          match: claim,
          why: 'Пункт из config.forbiddenClaims этой ветки.',
        });
      }
    }
  }

  return hits;
}
