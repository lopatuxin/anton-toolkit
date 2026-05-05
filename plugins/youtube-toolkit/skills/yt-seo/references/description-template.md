# Description template (Russian)

The full description goes in YouTube Studio. Aim ~800–1200 characters total. The first 2 lines must work as a search snippet.

## Block order

```
<HOOK LINE — 1-2 sentences, repeats value prop, contains a primary keyword>

<SERIES BREADCRUMB — only for flagship episodes>

⏱ Тайм-коды:
0:00 — Хук / интро
0:15 — <act 1 name>
N:NN — <act 2 name>
…

📌 <SOFT CTA — one line>

🔗 Полезные ссылки:
- <Tool name>: <URL or "поиск в Google">
- Репозиторий проекта: <URL or "ссылка позже">
- Прошлая серия: <URL or "—">
- Связанные видео: <URL>

#хэштег1 #хэштег2 #хэштег3
```

## Hook line rules

The first 1–2 lines are visible in search results and on mobile. They must:

- Contain the primary keyword (tool, series name, outcome).
- Repeat the title's value prop in plainer language.
- NOT start with "В этом видео..." — wastes the snippet slot.

Good:
> Собрал полноценную CRM для автосервиса на Cursor за два дня. Без backend-опыта, по шагам — что сработало, что пришлось переделать.

Bad:
> В этом видео я расскажу как я делал CRM. Будет интересно!

## Series breadcrumb

For flagship-series episodes only:

> 🧠 Логос — серия про сборку Jarvis-подобного ассистента с AI. Это эпизод #7. Все эпизоды: [плейлист].

For CRM:

> 🛠 Серия про vibe-coding бизнес-приложений. Это эпизод #N. Плейлист: [URL].

Skip for standalone videos.

## Timestamps

- **6 entries** for 8 min video, **8 entries** for 12 min, **10–12 entries** for 18–20 min.
- First entry always `0:00 — Хук / интро`.
- Each entry names the section as the viewer would understand, not as the script labels it. Use Russian.
- If timestamps are placeholders (script not finalised), prefix the block with `⏱ Тайм-коды (черновик):` and use `0:00`, `0:30`, `2:00` rounded.

## CTA

Use one line. Choose:

**Soft (default — site not live):**
> 📌 Заказ разработки приложений с AI — контакты в закреплённом комментарии.

**With site (when {{SITE_URL}} replaced):**
> 📌 Заказ разработки: {{SITE_URL}}

Do not duplicate the CTA in multiple places. One line, one place. The closing pinned comment carries the actual link.

## Links section

Include only links that pay off. Empty link section is fine — do not pad.

- Tools mentioned: link to homepage or search.
- Repository: if the user has one for this video.
- Previous series episode: if flagship.
- 1–2 related videos from this channel: helps watch-time.
- Avoid: affiliate links unless the user explicitly opts in. Tool homepages without affiliation only.

## Hashtags

3–5 hashtags at the very end. Up to 3 will show above the title on the watch page; YouTube prioritises the first ones.

Order: most channel-specific first.

Examples:
- `#vibecoding #aiразработка #cursor #логос #разработка`
- `#aiкодинг #claudecode #crm #python`

Do NOT use:
- More than 5 hashtags (YouTube ignores the rest and may down-rank).
- Generic-only hashtags (`#video #youtube`) — wasted slots.
- Branded hashtags from other channels.

## Length and formatting

- 800–1200 characters total. Above that, viewers stop reading — and the algorithm does not weight extra text proportionally.
- Use emoji headers (⏱, 📌, 🔗, 🧠, 🛠) only as defined above. Do not festoon the description.
- No empty links ("ссылка позже" placeholder is fine in draft, must be removed before publish).
- Russian throughout. Tool names in original form (Cursor, Claude Code, Python, CRM).
