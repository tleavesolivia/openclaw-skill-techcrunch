# OpenClaw TechCrunch Skill

A TechCrunch news collection and AI analysis skill for OpenClaw.

## Features

- **RSS Feed Collection** — Fetches articles from official TechCrunch RSS feeds
- **SQLite Storage** — Persistent database with deduplication
- **AI Summarization** — Generate time-based news briefings
- **Multi-category Support** — AI, Startups, Venture, Fundraising
- **Cron Integration** — Daily automated briefings

## Installation

```bash
# Clone or download this skill to your OpenClaw workspace
cd ~/.openclaw/workspace/skills
# Download from GitHub or copy files manually

# Install dependency
npm install better-sqlite3
```

## File Structure

```
tech-news/
├── SKILL.md              # Skill definition and architecture
├── README.md             # This file
├── scripts/
│   ├── collector.js      # RSS collector (polls every 30 min)
│   └── query.js          # Search and query script
└── references/
    └── feeds.md          # RSS feed URLs and categories
```

## Usage

### Start Collector

```bash
# Run once (test)
node scripts/collector.js --test

# Run as daemon (background)
node scripts/collector.js --daemon

# Check stats
node scripts/collector.js --stats
```

### Query Articles

```bash
# Last 24 hours AI news
node scripts/query.js --hours 24 --category AI

# Keyword search
node scripts/query.js --keyword "Anthropic"

# JSON output (for AI processing)
node scripts/query.js --hours 24 --json
```

### OpenClaw Integration

In OpenClaw chat:
- "过去24小时AI新闻总结" — Chinese summary
- "TechCrunch AI news summary" — English summary
- "Search TechCrunch for X" — Keyword search

## RSS Feeds

Subscribed categories:
- AI: `https://techcrunch.com/category/artificial-intelligence/feed/`
- Startups: `https://techcrunch.com/category/startups/feed/`
- Venture: `https://techcrunch.com/category/venture/feed/`
- Fundraising: `https://techcrunch.com/category/fundraising/feed/`

See [references/feeds.md](references/feeds.md) for full list.

## Cron Job (Daily Briefing)

```bash
openclaw cron add \
  --name "TechCrunch Daily Briefing" \
  --cron "0 8 * * *" \
  --tz "Asia/Shanghai" \
  --message "Generate TechCrunch news summary for past 24 hours" \
  --channel telegram
```

## Output Format

### Funding Rounds (Bullet Points)

```
- Cursor: $2B+ @ $50B (rumored); AI coding tool, enterprise surge; invested by a16z and Thrive
- Factory: $150M @ $1.5B; AI coding for enterprise; invested by Khosla Ventures
```

## License

MIT

## Credits

- Data source: TechCrunch RSS feeds (official, free)
- Built for OpenClaw (https://github.com/openclaw/openclaw)

## RSS Terms of Use

TechCrunch RSS feeds are provided for use in news readers:
- Display with attribution to TechCrunch
- Link to full article on TechCrunch
- No advertising in feed content
- TechCrunch may discontinue feeds at any time

Source: https://techcrunch.com/rss-terms-of-use/