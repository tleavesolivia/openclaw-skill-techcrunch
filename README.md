# TechCrunch Skill

A TechCrunch news collection and AI analysis skill for OpenClaw.

## Features

- **RSS Feed Collection** â€” Fetches articles from official TechCrunch RSS feeds
- **SQLite Storage** â€” Persistent database with deduplication
- **AI Summarization** â€” Generate time-based news briefings
- **Multi-category Support** â€” AI, Startups, Venture, Fundraising
- **Cron Integration** â€” Daily automated briefings

## Installation

```bash
# Clone or download this skill to your OpenClaw workspace

# Linux/Mac
cd ~/.openclaw/workspace/skills

# Windows
cd C:\Users\your user name\.openclaw\workspace\skills

# Download from GitHub or copy files manually
git clone https://github.com/tleavesolivia/techcrunch-skill.git tech-news

# Or manually: Download ZIP from GitHub â†’ extract to skills/tech-news/

# Install dependency
cd tech-news
npm install better-sqlite3
```

## File Structure

```
tech-news/
â”œâ”€â”€ SKILL.md              # Skill definition and architecture
â”œâ”€â”€ README.md             # This file
â”œâ”€â”€ scripts/
â”‚   â”œâ”€â”€ collector.js      # RSS collector (polls every 30 min)
â”‚   â””â”€â”€ query.js          # Search and query script
â””â”€â”€ references/
    â””â”€â”€ feeds.md          # RSS feed URLs and categories
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
- "è¿‡åŽ»24å°æ—¶AIæ–°é—»æ€»ç»“" â€” Chinese summary
- "TechCrunch AI news summary" â€” English summary
- "Search TechCrunch for X" â€” Keyword search

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
- Cursor: $2B+ raised @ $50B valuation (rumored); AI coding tool, enterprise surge; invested by a16z and Thrive
- Factory: $150M raised @ $1.5B valuation; AI coding for enterprise; invested by Khosla Ventures
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
