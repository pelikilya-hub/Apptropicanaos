# Workflows

| Файл | Когда | Что делает |
|---|---|---|
| `ci-main.yml` | push/PR в `main` | типы, валидация шаблона, аудит пересечений, сборка, проверка на секреты |
| `deploy-landing.yml` | push в `landings/**`, PR с правками `landings/**` | валидация (на PR — превью, на push — прод), сборка, деплой на Cloudflare Pages |

## Секреты репозитория

| Секрет | Зачем |
|---|---|
| `CLOUDFLARE_API_TOKEN` | токен с правом `Cloudflare Pages: Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | id аккаунта Cloudflare |

Ключи аналитики сюда **не** кладутся: страница статическая, провайдер
подключается адаптером по имени из `config.analytics.provider`.

## Проект Cloudflare Pages

Имя проекта = slug ветки (`landings/kata-family` → проект `kata-family`).
Проект создаётся один раз вручную, боевой домен привязывается к нему
и должен совпадать с `config.domain`. Деплой сам домены не создаёт.
