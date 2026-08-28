---
name: tech-news
description: |
  TechCrunch news collection and AI analysis skill. Fetches articles from TechCrunch RSS feeds.
  Subscribed categories: AI, Startups, Venture, Fundraising.
  Triggers: "tech news summary", "TechCrunch AI news", "startup news", "venture capital news", "fundraising rounds", "è¿‡åŽ»Xå°æ—¶ç§‘æŠ€æ–°é—»".
---

# Tech_News Skill

Collect and analyze TechCrunch articles from RSS feeds.

## Subscribed RSS Feeds

| Category | RSS URL |
|----------|---------|
| AI | `https://techcrunch.com/category/artificial-intelligence/feed/` |
| Startups | `https://techcrunch.com/category/startups/feed/` |
| Venture | `https://techcrunch.com/category/venture/feed/` |
| Fundraising | `https://techcrunch.com/category/fundraising/feed/` |

See [references/feeds.md](references/feeds.md) for full feed list.

## Architecture

Same as jin10 skill:

```
│ Base layer (atomic operations)
│ ├─ RSS Fetch — poll RSS feed, parse XML
│ ├─ Dedup — deduplicate by guid, prevent duplicate entries
│ └─ Store — persist to SQLite database
│
│ Feature layer (single capabilities)
│ ├─ Search — keyword / category search
│ ├─ Summarize — timeline narrative summary
│ ├─ Health Check — collector status check
│ └─ Stats — data statistics
│
│ Application layer (feature composition + automation)
│ ├─ Event tracking = Search + Summarize
│ ├─ Keyword alert = Search + Push
│ ├─ Scheduled push = Summarize + cron
│ └─ Hot-topic stats = Search + Aggregate
```

## Database Schema

Table: `tech_news`
- `guid` (TEXT PRIMARY KEY) â€” Unique article ID
- `title` (TEXT) â€” Article title
- `link` (TEXT) â€” Article URL
- `author` (TEXT) â€” Author name
- `pub_date` (DATETIME) â€” Publication time
- `categories` (TEXT) â€” Comma-separated categories
- `description` (TEXT) â€” Article summary
- `fetched_at` (DATETIME) â€” When fetched

Table: `collector_stats`
- Poll count, saved count, skipped count, error count

## Collector Script

See [scripts/collector.js](scripts/collector.js)

**Poll interval:** 30 minutes (TechCrunch updates less frequently than jin10)

## Query Script

**Local version**: scripts/query-local.js — reads the local SQLite database directly
**Cloud version**: scripts/query.js — calls the cloud API (currently suspended; we recommend using the local version)

**Search modes:**
- `--hours N` â€” Articles from last N hours
- `--keyword "XYZ"` â€” Keyword search
- `--stats` â€” Show collector stats
- `--brief` â€” Brief output (title + date only)
- `--json` â€” JSON output

## Output Language

Default: English (TechCrunch articles are in English)
User can request Chinese summary: "è¿‡åŽ»24å°æ—¶ç§‘æŠ€æ–°é—»æ€»ç»“" â†’ Chinese output

## Output Format Preferences

### Funding Rounds (Bullet Points)

When generating funding rounds summary, use bullet points (NOT tables):

**Format:** `**Company**: $Amount raised @ $valuation (status); brief description; invested by Investor1 and Investor2`

**Note:**
- If valuation not disclosed, omit the @valuation part
- Include round stage if known (e.g. "Series A", "Series C")
- Brief description should be 5-10 words max

**Example:**
- **Cursor**: $2B+ raised @ $50B valuation (rumored); AI coding tool, enterprise growth surge; invested by a16z and Thrive
- **Factory**: $150M raised @ $1.5B valuation; AI coding for enterprise; invested by Khosla Ventures
- **Loop**: $95M raised (Series C); Supply chain AI for disruption prediction; invested by Valor

## Notes

- RSS feed is official and free, no API key needed
- Articles may overlap across categories (same article in AI + Startups)
- Dedup by `guid` ensures no duplicates in database
