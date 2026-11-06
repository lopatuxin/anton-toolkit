# Finances — reading the owner's finance app database

The monthly review takes the owner's financial picture from his finance app (Budget Invest Bloom,
repo `C:\projects\budget-invest-bloom-monorepo`). Its PostgreSQL runs locally in Docker as the
container `bib-postgres`, database `bib`, user `bib`; the socket inside the container needs no
password, so never read `.env` or ask for credentials. **Read only** — `SELECT`, never a write.

The database holds test accounts from QA runs; the owner's own records are those of the user with
email `lopatuxin.a@gmail.com` in `auth.users`. Every query filters on that user.

## Running the query

Docker is reachable from PowerShell, not from the Git Bash sandbox. Write the SQL below to a file in
the scratchpad (set `\set month 'YYYY-MM'` to the reviewed month) and pipe it in:

```powershell
Get-Content <scratchpad>\fin.sql -Raw | docker exec -i bib-postgres psql -U bib -d bib -At -F ' | '
```

If `docker` fails or the container is not running, do not start it and do not retry in a loop: write
the review without the finance section's numbers and say in it plainly «база финансов была
недоступна».

```sql
\set month '2026-08'
WITH u AS (SELECT id FROM auth.users WHERE email = 'lopatuxin.a@gmail.com'),
 p AS (SELECT to_date(:'month', 'YYYY-MM') AS m0)
SELECT 'income' AS k, source AS name, sum(amount) AS rub FROM budget.incomes, u, p
 WHERE user_id = u.id AND NOT is_transfer AND date >= m0 AND date < m0 + interval '1 month' GROUP BY source
UNION ALL
SELECT 'expense', c.name, sum(e.amount) FROM budget.expenses e JOIN budget.categories c ON c.id = e.category_id, u, p
 WHERE e.user_id = u.id AND NOT e.is_transfer AND e.date >= m0 AND e.date < m0 + interval '1 month' GROUP BY c.name
UNION ALL
SELECT 'avg12_income', '', sum(amount) / 12 FROM budget.incomes, u, p
 WHERE user_id = u.id AND NOT is_transfer AND date >= m0 - interval '12 months' AND date < m0
UNION ALL
SELECT 'avg12_expense', '', sum(amount) / 12 FROM budget.expenses, u, p
 WHERE user_id = u.id AND NOT is_transfer AND date >= m0 - interval '12 months' AND date < m0
UNION ALL
SELECT 'invested_net', '', coalesce((SELECT sum(amount) FROM budget.expenses, u, p WHERE user_id = u.id AND is_transfer AND date >= m0 AND date < m0 + interval '1 month'), 0)
 - coalesce((SELECT sum(amount) FROM budget.incomes, u, p WHERE user_id = u.id AND is_transfer AND date >= m0 AND date < m0 + interval '1 month'), 0)
UNION ALL
SELECT 'free_money_excl_payouts', '', (SELECT sum(amount) FROM budget.incomes, u WHERE user_id = u.id) - (SELECT sum(amount) FROM budget.expenses, u WHERE user_id = u.id)
UNION ALL
SELECT 'portfolio_cost', '', sum(total_cost) FROM investment.positions, u WHERE user_id = u.id AND quantity > 0
UNION ALL
SELECT 'portfolio_value', '', sum(ps.quantity * (CASE WHEN s.type IN ('BOND', 'OFZ') THEN sn.last_price * coalesce(s.nominal, 1000) / 100 ELSE sn.last_price END + coalesce(sn.accrued_interest, 0)))
 FROM investment.positions ps JOIN investment.securities s ON s.ticker = ps.security_ticker
 JOIN investment.price_snapshots sn ON sn.ticker = ps.security_ticker, u WHERE ps.user_id = u.id AND ps.quantity > 0
ORDER BY 1, 3 DESC;
```

## What the rows mean

- `income` / `expense` — the month's income by source (`SALARY`, `FREELANCE`, `INVESTMENTS`, `GIFTS`,
  `OTHER`) and spending by category. Transfers to and from the portfolio are excluded, as the app does.
- `avg12_*` — the average month over the 12 months before, the baseline to compare with.
- `invested_net` — money moved into the portfolio this month minus money taken out.
- `free_money_excl_payouts` — all income minus all spending ever. The app also adds dividend and
  coupon payouts received; this query does not, so the figure is slightly low — say so if you use it.
- `portfolio_cost` / `portfolio_value` — what the open positions cost and what they are worth at the
  latest quotes (a bond quote is a percent of its nominal, plus accrued coupon interest).

## In the review

A short `## Финансы` section: income, spending, what was left over and its share of income, the
top spending categories and the ones that jumped against the 12-month average, money put into the
portfolio, and the portfolio's value against its cost. Numbers rounded to thousands. Then what it
means for his goals — especially the goal of living off investments and his own products: how far
the portfolio's income is from covering his monthly spending. Interpretation, not a table dump.
