---
description: Полная приёмка ветки лендинга перед подключением домена
argument-hint: [slug] [--prod]
---

Прогони приёмку ветки: `$ARGUMENTS`

Следуй навыку `landing-acceptance`. Не отмечай пункт, не выполнив команду.

## Машинная часть

```bash
node tooling/validate-landing.mjs --slug <slug> --prod
node tooling/check-uniqueness.mjs
npm run build:landing -- --slug <slug> --prod
git grep -nE "(api[_-]?key|secret|token|G-[A-Z0-9]{8})" -- . ':!*.example'
```

## Браузерная часть

Подними `dist/` и проверь на 428px:

1. горизонтальный скролл: `scrollWidth - clientWidth === 0`
2. квиз доходит до маршрута **без единого поля контакта**
3. перезагрузка восстанавливает состояние, «назад» не теряет ответы
4. липкий CTA на мобиле ровно один
5. `canonical`, `og:url`, `robots.txt`, `sitemap.xml` смотрят только на свой домен

## Отчёт

Верни чек-лист приёмки из `landing-acceptance` с отметками
и отдельным списком того, что блокирует домен.
Если что-то не проверено — так и напиши, не отмечай.
