---
name: tech-news
description: |
  TechCrunch news collection and AI analysis skill. Fetches articles from TechCrunch RSS feeds.
  Subscribed categories: AI, Startups, Venture, Fundraising.
  Triggers: "tech news summary", "TechCrunch AI news", "startup news", "venture capital news", "fundraising rounds", "过去X小时科技新闻".
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
│ 基础层（原子操作）
│ ├─ RSS Fetch — 轮询 RSS feed，解析 XML
│ ├─ Dedup — 用 guid 去重，避免重复入库
│ └─ Store — SQLite 数据库持久化
│
│ 功能层（单一能力）
│ ├─ Search — 关键词/分类搜索
│ ├─ Summarize — 时间线叙事总结
│ ├─ Health Check — 采集状态检查
│ └─ Stats — 数据统计
│
│ 应用层（功能层的组合 + 自动化）
│ ├─ 事件追踪 = 搜索 + 总结
│ ├─ 关键词告警 = 搜索 + 推送
│ ├─ 定时推送 = 总结 + cron
│ └─ 热词统计 = 搜索 + 聚合
```

## Database Schema

Table: `tech_news`
- `guid` (TEXT PRIMARY KEY) — Unique article ID
- `title` (TEXT) — Article title
- `link` (TEXT) — Article URL
- `author` (TEXT) — Author name
- `pub_date` (DATETIME) — Publication time
- `categories` (TEXT) — Comma-separated categories
- `description` (TEXT) — Article summary
- `fetched_at` (DATETIME) — When fetched

Table: `collector_stats`
- Poll count, saved count, skipped count, error count

## Collector Script

See [scripts/collector.js](scripts/collector.js)

**Poll interval:** 30 minutes (TechCrunch updates less frequently than jin10)

## Query Script

See [scripts/query.js](scripts/query.js)

**Search modes:**
- `--hours N` — Articles from last N hours
- `--keyword "XYZ"` — Keyword search
- `--category "AI"` — Filter by category
- `--stats` — Show collector stats

## Output Language

Default: English (TechCrunch articles are in English)
User can request Chinese summary: "过去24小时科技新闻总结" → Chinese output

## Output Format Preferences

When generating funding rounds summary, use bullet points (NOT tables):

**Format:** `Company: $Amount @valuation (status); brief description; invested by Investor1 and Investor2`

**Example:**
- Cursor: $2B+ @ $50B (rumored); AI coding tool, enterprise growth surge; invested by a16z and Thrive
- Factory: $150M @ $1.5B; AI coding for enterprise; invested by Khosla Ventures
- Loop: $95M Series C; Supply chain AI for disruption prediction; invested by Valor

**Note:**
- If valuation not disclosed, omit the @valuation part
- Include round stage if known (e.g. "Series A", "Series C")
- Brief description should be 5-10 words max

## Notes

- RSS feed is official and free, no API key needed
- Articles may overlap across categories (same article in AI + Startups)
- Dedup by `guid` ensures no duplicates in database