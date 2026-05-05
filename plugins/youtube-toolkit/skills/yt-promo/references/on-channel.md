# On-channel lead-gen patterns

Mechanics built into the video itself, its description, and the comment thread. No external platforms.

## Pinned comment

The pinned comment is the single most under-used lead-gen surface on YouTube. It sits below the video forever. Treat it as the canonical "where to click" for the lead.

### Pattern 1 — Soft pinned (default for tutorials, reviews, flagship)

```
Если интересна разработка приложений с AI на заказ — напиши мне:
[ссылка на контакт / Telegram / email — одна штука]

Что нужно прислать в первом сообщении: задача в одном абзаце, желаемые сроки, бюджет если уже есть. Отвечу в течение 24 часов.
```

When the site goes live, replace the contact line with `{{SITE_URL}}`.

### Pattern 2 — Anchor pinned (for case studies and lead-gen anchor videos)

```
В этом видео — реальный кейс, как я собрал <thing> с AI.

Если у тебя задача похожего масштаба — напиши:
[ссылка]

Беру 2-3 проекта в месяц. Что прислать в первом сообщении: что делаешь, в чём боль, в какие сроки нужно решение. Лично читаю каждое.
```

### Pattern 3 — Series pinned (for flagship-series episodes)

```
🧠 Это эпизод #N серии "Логос" — как собрать Jarvis-подобного ассистента с AI.
Все эпизоды по порядку: [плейлист]

Делаю на заказ ассистенты, CRM, автоматизации с AI. Контакт:
[ссылка]
```

### Pinned comment rules

- One link, not three. Splitting destinations drops conversion.
- Short. 200 characters of useful is better than 800 of padding.
- Clear ask: "что прислать в первом сообщении". Filters out tire-kickers.
- Pin within 1 hour of publishing — early commenters' replies stack under it.

## End-screen

The last 20 seconds of every video. Three elements available: subscribe, related video, playlist (or second related video).

### Allocation

- **Subscribe** — always present, bottom-left.
- **Related video** — pick one specific video most likely to retain the current viewer:
  - Tutorial → another tutorial in the same tool/topic.
  - Case study → another case study or the building-series flagship.
  - Tool review → a comparison or a complementary tool review.
  - Flagship episode → the previous episode of the same series.
- **Playlist** (or second video):
  - For flagship series — the series playlist.
  - For one-offs — the channel's "best of" playlist if exists; else a second related video.

### Voice-over rules

- Last 20 seconds of voice-over names what's next ("следующая серия — про память контекста"), not generic engagement asks.
- Skip "ставь лайк, подпишись, нажимай колокольчик". The end-screen UI elements already do that visually. Doubling annoys the audience.
- One CTA in voice-over. Either the lead-gen CTA or "next video" — not both. Pick by video type.

### Element ordering (for the user when uploading)

1. Cue the end-screen at `length - 20s`.
2. Place subscribe bottom-left, related video centre, playlist bottom-right.
3. Voice-over delivers next-video tease.

## In-video CTAs

| Video type | Opening tease | Mid-roll | End-roll |
|---|---|---|---|
| Tutorial | — | — | soft |
| Tool review | — | — | soft |
| Case study | — | — | medium |
| Flagship episode | — | — | soft |
| Lead-gen anchor | tease | medium | explicit |

Wording bank lives in `skills/yt-script/references/cta.md` (single source of truth — kept there to avoid duplication).

## In-description CTA

One line. Once. Always paired with the link or the soft fallback. Description block is defined in `skills/yt-seo/references/description-template.md`.

## Comment-thread engagement

Two rules:

1. **First-hour replies.** Reply to the first 5–10 comments within an hour of publish. YouTube weights early engagement. Replies do not need to be long ("спасибо, рад что зашло" is fine), but they must be present.
2. **Lead-DMs through comments.** If a viewer asks about hiring/ordering in a comment, reply once with "написал в личку" or "напиши мне на [contact], отвечу подробно". Do not negotiate scope in public comments.

## Channel-banner / About page

Small effort, big delta. The banner and About page should:

- State what the channel is about in one sentence.
- State that you take orders for AI-assisted dev, with a clear contact.
- Pin the lead-gen anchor video as the channel trailer (visible to non-subscribers).

These are not per-video tasks — they are one-time set-up. Audit them in the first audit run.
