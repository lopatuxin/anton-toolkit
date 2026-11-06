# CTA placement and wording

The channel's commercial goal: orders for application development. CTAs in scripts feed that funnel.

## The site placeholder

Site is not live yet. Use `{{SITE_URL}}` everywhere in scripts. When the site goes live, the user will replace it. Do not invent a URL.

Soft fallback (use until site is live):

> "Контакты для заказа разработки — в закреплённом комментарии под видео."

## CTA placement by video type

| Video type | Opening | Mid-roll (40–60%) | End-roll |
|---|---|---|---|
| Tutorial | — | — | ✓ soft |
| Tool review | — | — | ✓ soft |
| Case study | — | — | ✓ medium |
| Flagship episode | — | — | ✓ soft |
| Lead-gen anchor | ✓ tease | ✓ medium | ✓ explicit |

Soft = one sentence, no pause. Medium = one beat (3–4 sec) of dedicated CTA. Explicit = full 15–20 sec dedicated CTA with clear ask.

## Wording bank

### Soft (end-roll, all video types)

> "Если интересна разработка приложений с AI — контакты в закреплённом комментарии. Дальше — следующая серия."

> "Делаю CRM, ассистенты, автоматизации с AI на заказ. Ссылка в закреплённом — пишите."

### Medium (end-roll for case studies, mid-roll for lead-gen)

> "Кстати — такие проекты я делаю не только для себя. Если у тебя есть задача похожего масштаба, напиши — ссылка для контакта в закреплённом комментарии под видео. Я лично смотрю каждое сообщение."

### Explicit (end-roll, lead-gen anchor only)

> "Если ты досмотрел до этого момента — у нас совпали взгляды на то как сейчас делать продукт. Я беру 2-3 проекта в месяц на разработку: CRM, ассистенты, инструменты автоматизации, всё с использованием AI как у нас в этом видео. Контакт — в закреплённом комментарии. Опиши задачу одним абзацем, я отвечу в течение 24 часов."

### Opening tease (lead-gen anchor only, before hook)

The opening tease is one sentence inserted right after the hook, before Act 1. Goal: prime the lead-gen frame without breaking momentum.

> "Спойлер: такое же я делаю на заказ — но об этом в конце. Сейчас — как именно я это собрал."

## Wording rules

- **No "лайк-подписка-колокольчик"** in CTAs. The channel asks for a *commercial action* (contact for orders), not engagement signals.
- **Do not stack engagement asks with the lead-gen ask.** Pick one CTA per beat.
- **Do not promise time-bound replies you won't honour.** "В течение 24 часов" only if true.
- **CTA must point to ONE place:** the closing comment with link. Do not list site, telegram, email, github simultaneously — that splits attention.

## When the site goes live

Replace `{{SITE_URL}}` in every reference file that uses it:

- `skills/yt-script/references/cta.md` (this file)
- `skills/yt-seo/references/description-template.md`
- `skills/yt-promo/references/on-channel.md`
- `skills/yt-promo/references/funnel.md`
- `skills/yt-ideas/references/niche-context.md`

Switch the soft fallback wording from "контакты в закреплённом" to "контакты на сайте — ссылка в описании, {{SITE_URL}}".
