// Системные запреты каркаса. Действуют на все ветки и не отключаются конфигом.
// Ветка может только ДОБАВИТЬ свои через config.forbiddenClaims.
//
// scope:
//   'all'   — запрещено везде, включая офферный блок
//   'prose' — запрещено в свободном тексте, но допустимо в структурированном
//             оффере ($.fonar), где валидатор отдельно требует source и validUntil.
//             Так «осталось 3 виллы» можно сказать цифрой с источником и датой,
//             но нельзя вписать лозунгом в hero или разъяснения.
export const OFFER_PATH = '$.fonar';

export const SYSTEM_FORBIDDEN = [
  {
    id: 'superlative-market',
    scope: 'all',
    re: /\b(лучш(ая|ие|ий|ее)|топ-?1|номер\s*один|самая\s+выгодная)\s+(недвижимост|инвестиц|вилл|апартамент)/i,
    why: 'Превосходная степень про рынок. Органический тон — справочник, а не оффер.',
  },
  {
    id: 'guaranteed-yield',
    scope: 'all',
    re: /(гарантир\w*\s+(доход|доходност|прибыл|окупаем|аренд)|доходность\s+гарантир|guaranteed\s+(yield|roi|return))/i,
    why: 'Гарантия доходности запрещена: это обещание, которое нельзя обеспечить.',
  },
  {
    id: 'no-risk',
    scope: 'all',
    re: /(без\s+риск(а|ов)|нулев(ой|ые)\s+риск|risk[-\s]?free)/i,
    why: '«Без риска» — недостоверное утверждение о сделке с недвижимостью.',
  },
  {
    id: 'fake-scarcity',
    scope: 'prose',
    re: /(остал(ось|ась|ись)\s+(всего\s+)?\d+|последн(яя|ие)\s+\d+\s+(вилл|лот|юнит|квартир)|успей(те)?\s+купить)/i,
    why: 'Дефицит вне оффера. Остаток указывается в fonar.scarcity — с source и validUntil.',
  },
  {
    id: 'countdown',
    scope: 'prose',
    re: /(таймер|обратн(ый|ого)\s+отсч[её]т|акция\s+заканчивается|только\s+сегодня|скидка\s+действует\s+до)/i,
    why: 'Срочность вне оффера. Срок указывается в fonar.deadline — с source и validUntil.',
  },
  {
    id: 'grey-land-scheme',
    scope: 'all',
    re: /(номинальн\w+\s+(тайск|владел|акционер)|обход\s+(закон|ограничен)|схем\w*\s+(владения\s+землёй|обхода)|подставн\w+\s+компан)/i,
    why: 'Серые схемы владения землёй не описываем. Только отправка к независимому юристу.',
  },
  {
    id: 'fake-reviews',
    scope: 'all',
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

const isInOffer = (path) => path === OFFER_PATH || path.startsWith(`${OFFER_PATH}.`);

/** Проверяет тексты конфига против системных и веточных запретов. */
export function findForbidden(config, extraClaims = []) {
  const strings = collectStrings(config).filter(
    // forbiddenClaims — это сам список запретов, а не текст страницы.
    (s) => !s.path.startsWith('$.forbiddenClaims')
  );

  const hits = [];

  for (const { id, re, why, scope } of SYSTEM_FORBIDDEN) {
    for (const { path, value } of strings) {
      if (scope === 'prose' && isInOffer(path)) continue;
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
