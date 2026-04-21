/**
 * TechCrunch RSS Collector
 * Polls RSS feeds and stores articles in SQLite database
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Try to load better-sqlite3, fallback to simple storage if not available
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.log('Warning: better-sqlite3 not available, using simple JSON storage');
}

const DB_PATH = path.join(__dirname, '../data/tech-news.db');
const STATS_PATH = path.join(__dirname, '../data/collector-stats.json');
const FEEDS = [
  { name: 'AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { name: 'Startups', url: 'https://techcrunch.com/category/startups/feed/' },
  { name: 'Venture', url: 'https://techcrunch.com/category/venture/feed/' },
  { name: 'Fundraising', url: 'https://techcrunch.com/category/fundraising/feed/' }
];

const POLL_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Stats tracking
let stats = {
  polls: 0,
  saved: 0,
  skipped: 0,
  errors: 0,
  lastPoll: null,
  startTime: null
};

// Initialize database
function initDB() {
  if (Database) {
    const db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS tech_news (
        guid TEXT PRIMARY KEY,
        title TEXT,
        link TEXT,
        author TEXT,
        pub_date DATETIME,
        categories TEXT,
        description TEXT,
        feed_name TEXT,
        fetched_at DATETIME
      );
      CREATE INDEX IF NOT EXISTS idx_pub_date ON tech_news(pub_date);
      CREATE INDEX IF NOT EXISTS idx_categories ON tech_news(categories);
      CREATE TABLE IF NOT EXISTS collector_stats (
        id INTEGER PRIMARY KEY,
        polls INTEGER,
        saved INTEGER,
        skipped INTEGER,
        errors INTEGER,
        last_poll DATETIME
      );
    `);
    return db;
  }
  return null;
}

// Simple JSON storage fallback
function loadSimpleDB() {
  if (fs.existsSync(DB_PATH.replace('.db', '.json'))) {
    return JSON.parse(fs.readFileSync(DB_PATH.replace('.db', '.json'), 'utf8'));
  }
  return { articles: [] };
}

function saveSimpleDB(data) {
  fs.writeFileSync(DB_PATH.replace('.db', '.json'), JSON.stringify(data, null, 2));
}

// Fetch RSS feed
async function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Parse RSS XML
function parseRSS(xml) {
  const articles = [];
  // Simple regex-based parsing (works for TechCrunch RSS)
  const itemRegex = /<item>(.*?)<\/item>/gs;
  const matches = xml.matchAll(itemRegex);
  
  for (const match of matches) {
    const item = match[1];
    
    const titleMatch = item.match(/<title>(.*?)<\/title>/);
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const authorMatch = item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/);
    const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const guidMatch = item.match(/<guid[^>]*>(.*?)<\/guid>/);
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
    
    // Extract categories
    const catMatches = item.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/gs);
    const categories = Array.from(catMatches, m => m[1]).join(',');
    
    if (titleMatch && guidMatch) {
      articles.push({
        guid: guidMatch[1],
        title: titleMatch[1],
        link: linkMatch ? linkMatch[1] : '',
        author: authorMatch ? authorMatch[1] : '',
        pub_date: dateMatch ? dateMatch[1] : '',
        categories: categories,
        description: descMatch ? descMatch[1] : ''
      });
    }
  }
  
  return articles;
}

// Save articles to database
function saveArticles(db, articles, feedName) {
  const now = new Date().toISOString();
  
  if (Database && db) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO tech_news 
      (guid, title, link, author, pub_date, categories, description, feed_name, fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const article of articles) {
      const result = insert.run(
        article.guid,
        article.title,
        article.link,
        article.author,
        article.pub_date,
        article.categories,
        article.description,
        feedName,
        now
      );
      if (result.changes > 0) {
        stats.saved++;
      } else {
        stats.skipped++;
      }
    }
  } else {
    // Simple JSON storage
    const data = loadSimpleDB();
    for (const article of articles) {
      const exists = data.articles.find(a => a.guid === article.guid);
      if (!exists) {
        data.articles.push({
          ...article,
          feed_name: feedName,
          fetched_at: now
        });
        stats.saved++;
      } else {
        stats.skipped++;
      }
    }
    saveSimpleDB(data);
  }
}

// Main collection loop
async function collect(db) {
  stats.polls++;
  stats.lastPoll = new Date().toISOString();
  
  console.log(`\n=== TechCrunch RSS Collection - ${stats.lastPoll} ===`);
  
  for (const feed of FEEDS) {
    try {
      console.log(`Fetching ${feed.name}...`);
      const xml = await fetchRSS(feed.url);
      const articles = parseRSS(xml);
      console.log(`  Found ${articles.length} articles`);
      
      saveArticles(db, articles, feed.name);
    } catch (err) {
      console.error(`  Error fetching ${feed.name}: ${err.message}`);
      stats.errors++;
    }
  }
  
  console.log(`\nStats: saved=${stats.saved}, skipped=${stats.skipped}, errors=${stats.errors}`);
  
  // Save stats
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
}

// Run once (for testing)
async function runOnce() {
  if (Database) {
    const db = initDB();
    stats.startTime = new Date().toISOString();
    await collect(db);
    db.close();
    console.log('\nCollection complete. Database saved.');
  } else {
    stats.startTime = new Date().toISOString();
    await collect(null);
    console.log('\nCollection complete. JSON saved.');
  }
}

// Run as daemon
async function runDaemon() {
  if (Database) {
    const db = initDB();
    stats.startTime = new Date().toISOString();
    
    // Initial collection
    await collect(db);
    
    // Schedule periodic collection
    setInterval(() => collect(db), POLL_INTERVAL);
    
    console.log(`\nCollector running. Poll interval: ${POLL_INTERVAL / 60000} minutes.`);
    console.log('Press Ctrl+C to stop.');
    
    // Keep process alive
    process.on('SIGINT', () => {
      db.close();
      console.log('\nCollector stopped.');
      process.exit(0);
    });
  } else {
    stats.startTime = new Date().toISOString();
    await collect(null);
    setInterval(() => collect(null), POLL_INTERVAL);
    console.log(`\nCollector running (JSON mode). Poll interval: ${POLL_INTERVAL / 60000} minutes.`);
  }
}

// Show stats
function showStats() {
  if (fs.existsSync(STATS_PATH)) {
    const s = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
    console.log('\n=== TechCrunch Collector Stats ===');
    console.log(`Start Time: ${s.startTime}`);
    console.log(`Last Poll: ${s.lastPoll}`);
    console.log(`Total Polls: ${s.polls}`);
    console.log(`Articles Saved: ${s.saved}`);
    console.log(`Articles Skipped (duplicates): ${s.skipped}`);
    console.log(`Errors: ${s.errors}`);
    
    // Count articles in DB
    if (Database) {
      const db = new Database(DB_PATH);
      const count = db.prepare('SELECT COUNT(*) as count FROM tech_news').get();
      console.log(`Total Articles in DB: ${count.count}`);
      db.close();
    } else if (fs.existsSync(DB_PATH.replace('.db', '.json'))) {
      const data = JSON.parse(fs.readFileSync(DB_PATH.replace('.db', '.json'), 'utf8'));
      console.log(`Total Articles in JSON: ${data.articles.length}`);
    }
  } else {
    console.log('No stats available yet.');
  }
}

// CLI
const args = process.argv.slice(2);
if (args.includes('--test') || args.includes('--once')) {
  runOnce();
} else if (args.includes('--stats')) {
  showStats();
} else if (args.includes('--daemon')) {
  runDaemon();
} else {
  // Default: run once
  runOnce();
}