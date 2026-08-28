# Landing Factory

Фабрика органических лендингов недвижимости Пхукета.
**Один репозиторий → ветка на лендинг → свой домен.**

Конституция проекта — [`PROMPT.md`](./PROMPT.md).
Рабочая инструкция — [`CLAUDE.md`](./CLAUDE.md).

## Быстрый старт

```bash
npm install
npm run dev            # локальный просмотр активного лендинга
npm run build          # валидация + статическая сборка в dist/
```

Без аргументов собирается единственный лендинг текущей ветки,
в `main` это `landings/_example`.

## Новый лендинг

```bash
npm run new:landing -- --slug area-kata-family --type area
```

Скрипт создаёт каталог из `_example`, ветку `landings/<slug>` и черновик конфига
с пустыми коммерческими полями. Он ничего не деплоит и ничего не выдумывает:
незаполненные факты остаются как `[ДАННЫЕ]`.

Дальше конфиг заполняет человек или редактор, после чего:

```bash
npm run validate:landing -- --slug area-kata-family
npm run build:landing -- --slug area-kata-family
```

## Стек

| Слой | Выбор |
|---|---|
| сборка | Astro, статический вывод |
| стили | Tailwind поверх токенов `packages/ui` |
| интерактив | vanilla TS, движок квиза в `packages/quiz` |
| деплой | Cloudflare Pages, домен из `config.domain` |

Без jQuery, без SPA-фреймворка, без общей CMS на все домены.
`dist/` открывается как набор статических файлов, без бэкенда.

## Ветки

```
main                    каркас, пакеты, шаблон, схемы, CI
landings/<slug>         полный лендинг под один домен
hotfix/<slug>-<issue>   точечный фикс живого домена
```

Обратно в `main` из ветки лендинга едет только общее: баг компонента, токен,
улучшение движка квиза. Контент комплекса в `main` не тащить.

## Структура

```
packages/           общие пакеты: ui, fonar, quiz, explain, seo, analytics, legal, config
templates/landing/  скелет страницы, фиксированный порядок секций
schemas/            landing.schema.json, quiz.schema.json
tooling/            create / validate / build / uniqueness / forbidden
landings/_example/  шаблон ветки
docs/memory/        реестр доменов и принятые решения
```

## Проверки

```bash
npm run validate:landing            # схема, Фонарь, FAQ, разъяснения, запреты
npm run validate:landing -- --prod  # плюс требования боевого домена
npm run audit:uniqueness            # пересечения между доменами
```

Валидатор блокирует сборку, если нет Фонаря, H1, типа, языка,
меньше 4 FAQ, меньше 3 разъяснений, а на проде — если пустой `domain`
или в текстах остался `[ДАННЫЕ]`.

## Секреты

Ключи аналитики и пиксели в репозиторий не коммитятся.
В `config.analytics` только имя провайдера, в `.env.example` только имена переменных.

## Тулинг Claude Code

Репозиторий несёт свой набор навыков и команд в `.claude/`
(`/new-landing`, `/check-landing`, `/landing-matrix`) и подключает плагины
из официального каталога Anthropic и из superpowers-marketplace.
Список — в `.claude/settings.json`, подробности — в `CLAUDE.md`.
