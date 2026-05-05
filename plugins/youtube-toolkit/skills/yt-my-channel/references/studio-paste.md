# Parsing pasted YouTube Studio data

The user may paste a table copied from YouTube Studio → Content (Контент), Analytics → Overview, or Analytics → Reach. Format varies — be tolerant.

## What to extract

Per video, try to read:

- Title (always present)
- Views (impressions / просмотры)
- Impressions (показы)
- CTR (CTR показов / Click-through rate)
- Average view duration (Средняя продолжительность просмотра, m:ss)
- Average percentage viewed (Средний процент просмотра, %)
- Likes / Comments (if present)
- Date published (Дата публикации)

Per channel-level overview, read:

- Date range
- Channel views
- Channel watch time (hours)
- Channel CTR average
- Channel average view duration

## Parsing approach

1. Detect rows by line breaks. Most pastes are tab-separated or have multi-space columns.
2. Detect the header row by Russian column names ("Видео", "Просмотры", "Показы", "CTR", "Средняя продолжительность просмотра", "Средний процент просмотра", "Лайки", "Комментарии").
3. Map columns by name, not by position — Studio reorders.
4. Convert "12 тыс." → 12000, "1,2 млн" → 1200000, "1.234" (Russian thousands separator) → 1234.
5. CTR may be "5,3%" — strip the percent sign and comma-as-decimal.
6. Duration "1:23" → 83 seconds.

## When parsing fails

If the paste is unclear (e.g., missing column header, mixed locales, screenshots described in text), ask once:

> "Не могу разобрать таблицу — пришли копипасту из колонок 'Видео', 'Просмотры', 'CTR показов' и 'Средняя продолжительность просмотра' за последние 28 или 90 дней."

Do not silently guess values.

## Use in the report

- Add the **Studio data** section (section 7 of the report template).
- Cross-reference with public metrics: e.g., "video X has high CTR but low retention" → flag in Hypotheses, not in Snapshot.
- Never fabricate Studio numbers if the user did not paste them.
