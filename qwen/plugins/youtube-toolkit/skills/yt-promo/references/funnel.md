# Funnel design — view → order

The full path from "viewer watched a video" to "qualified project intake". Five stages.

## The single-destination rule

At any point in the funnel, the lead should have **exactly one** next action and **one** place to click.

- One CTA in the video.
- One CTA in the description.
- One link in the pinned comment.
- All three point at the same destination.

Splitting (site + Telegram + email + form) drops conversion sharply. Pick the destination that converts best for the user's current setup.

## Pre-site mode (placeholder `{{SITE_URL}}`)

Until the site is live, the destination is a Telegram/email contact published in the pinned comment. The script and description use the soft fallback: "контакты в закреплённом комментарии".

The pinned comment itself contains the only contact link. This is fine — Telegram converts well for IT services and is low-friction for Russian-speaking audience.

## Post-site mode (`{{SITE_URL}}` live)

The destination becomes the site. Replace `{{SITE_URL}}` in every reference file that uses it:

- `skills/yt-script/references/cta.md`
- `skills/yt-seo/references/description-template.md`
- `skills/yt-promo/references/on-channel.md` (pinned comment patterns)
- `skills/yt-promo/references/funnel.md` (this file)
- `skills/yt-ideas/references/niche-context.md`

The site should:

- Have a single primary CTA (form or contact).
- Load fast, work on mobile.
- Show 2–3 case-study examples (tie back to the lead-gen anchor videos).
- Have a clear "что прислать в первом сообщении" instruction — same as the pinned comment, on-site.

## Stage 1 — Awareness

Source: a viewer watches a video.

- Lead-gen anchor video plants the seed (opening tease + mid-roll + end-roll).
- Other video types plant a softer seed (end-roll only).

The strongest awareness comes from a **case-study lead-gen anchor**. View → "this person can build the thing" → curiosity about hiring.

## Stage 2 — Interest

Source: viewer pays attention to a CTA.

- End-roll CTA delivers the verbal ask.
- Pinned comment delivers the written ask + contact info.
- Description CTA reinforces if the viewer scrolls.

The pinned comment is the conversion surface. Most leads click from there, not from in-video text.

## Stage 3 — Contact

Source: viewer sends the first message.

In pre-site mode, this lands in Telegram/email.
In post-site mode, this hits the site form (or whatever single destination the site has).

What to maximise:

- Low friction — one click from the pinned comment.
- Clear instruction — "что прислать в первом сообщении".
- Fast acknowledgement — within hours, even if a real reply takes longer.

## Stage 4 — Qualification

Source: the first inbound message.

The pinned comment / site asks for:

- Task in one paragraph.
- Desired timeline.
- Budget (if known).

Read the inbound message and qualify on:

- **Fit:** is this the kind of project the user wants to build (CRM, ассистент, automation)? Or is it out of scope (mobile games, hardware, blockchain)?
- **Realism:** budget vs scope is at least roughly aligned.
- **Decision authority:** is the person sending the message the one who decides?

If yes on all three → move to booking.
If no on any → polite redirect or qualifying question.

The qualification step is where 60–80% of inbound traffic drops. That is correct — the lead-gen system is filtering, not converting blindly.

## Stage 5 — Booking

Source: a qualified lead.

Convert into a structured intake:

- Schedule a 30-min call (or async-only if user prefers).
- Send a short brief template the lead fills.
- Confirm the project class and rough scope before quoting.

Quoting and contract terms are out of scope of this skill. The skill ends at "booked the first call".

## Drop-off risks

| Stage | Risk | Mitigation |
|---|---|---|
| Awareness → Interest | CTA at end-roll only, viewer left at minute 8 | Add mid-roll CTA for lead-gen anchors |
| Interest → Contact | Pinned comment unclear or buried | Pin within 1 hour, keep ≤ 200 chars, one link |
| Contact → Qualification | First message lands, no reply for 3 days | Set a 24-hour acknowledge SLA — even an "got it, will read tonight" |
| Qualification → Booking | Scope unclear, lead drifts | Send the brief template proactively |
| Booking → Project | Lead ghost after first call | Send 1 follow-up at 3 days, then drop |

## Metrics worth tracking (post-site mode)

- Pinned-comment click-through (if Telegram/site supports tracking).
- Inbound messages per video (split by lead-gen anchor vs others).
- Qualification rate (qualified / inbound).
- Booking rate (booked / qualified).
- Project rate (project started / booked).

Pre-site mode: track manually in a spreadsheet by video.
