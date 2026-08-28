#!/usr/bin/env node
/**
 * TechCrunch Query Script (Local Version)
 * Reads data directly from local SQLite database
 */

const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/tech-news.db');

// Try to load better-sqlite3
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('Error: better-sqlite3 not available');
  process.exit(1);
}

// Format date for display
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  } catch {
    return dateStr;
  }
}

// Query articles from local database
function queryArticles(options = {}) {
  const { hours, keyword, limit, json, brief, count, desc } = options;
  
  const db = new Database(DB_PATH);
  
  // Build query
  let sql = 'SELECT * FROM tech_news';
  let conditions = [];
  let params = [];
  
  if (hours) {
    const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    conditions.push('pub_date >= ?');
    params.push(startDate.toISOString());
  }
  
  if (keyword) {
    const keywords = keyword.split(',').map(k => k.trim());
    const keywordConditions = keywords.map(() => 'title LIKE ? OR description LIKE ?');
    conditions.push('(' + keywordConditions.join(' OR ') + ')');
    keywords.forEach(k => {
      params.push(`%${k}%`);
      params.push(`%${k}%`);
    });
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  // Order
  sql += desc ? ' ORDER BY pub_date DESC' : ' ORDER BY pub_date ASC';
  
  // Limit
  if (limit) {
    sql += ' LIMIT ' + parseInt(limit);
  }
  
  const articles = db.prepare(sql).all(...params);
  
  // Output
  if (count) {
    console.log(articles.length);
  } else if (json) {
    console.log(JSON.stringify(articles, null, 2));
  } else {
    if (articles.length === 0) {
      console.log('未找到相关文章。');
    } else {
      console.log(`\n=== TechCrunch 文章 (${articles.length} 条) ===\n`);
      articles.forEach((article, i) => {
        if (brief) {
          const content = (article.description || '').substring(0, 80);
          console.log(`[${formatDate(article.pub_date)}] ${article.title.substring(0, 60)}...`);
        } else {
          console.log(`${i + 1}. **${article.title}**`);
          console.log(`   - 作者: ${article.author || 'N/A'}`);
          console.log(`   - 时间: ${formatDate(article.pub_date)}`);
          console.log(`   - 分类: ${article.categories || 'N/A'}`);
          console.log(`   - 链接: ${article.link}`);
          console.log(`   - 摘要: ${(article.description || 'N/A').substring(0, 100)}...`);
          console.log();
        }
      });
    }
  }
  
  db.close();
  return articles;
}

// Show stats
function showStats() {
  const db = new Database(DB_PATH);
  
  const count = db.prepare('SELECT COUNT(*) as count FROM tech_news').get();
  const latest = db.prepare('SELECT pub_date, fetched_at FROM tech_news ORDER BY pub_date DESC LIMIT 1').get();
  const oldest = db.prepare('SELECT pub_date FROM tech_news ORDER BY pub_date ASC LIMIT 1').get();
  
  console.log('\n📊 TechCrunch Database');
  console.log(`   Records: ${count.count}`);
  console.log(`   Range: ${oldest?.pub_date || 'N/A'} ~ ${latest?.pub_date || 'N/A'}`);
  console.log(`   Size: ${(fs.statSync(DB_PATH).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Path: ${DB_PATH}`);
  
  // Check freshness
  if (latest?.fetched_at) {
    const lastFetch = new Date(latest.fetched_at);
    const minutesAgo = Math.floor((Date.now() - lastFetch.getTime()) / 60000);
    if (minutesAgo < 60) {
      console.log(`   Health: ✅ OK (last entry ${minutesAgo} min ago)`);
    } else if (minutesAgo < 1440) {
      console.log(`   Health: 🟡 SLOW (last entry ${Math.floor(minutesAgo / 60)} hours ago)`);
    } else {
      console.log(`   Health: ⚠️ STALE (last entry ${Math.floor(minutesAgo / 1440)} days ago)`);
    }
  }
  
  db.close();
}

// CLI
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--hours' && args[i + 1]) {
    options.hours = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--keyword' && args[i + 1]) {
    options.keyword = args[i + 1];
    i++;
  } else if (args[i] === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--json') {
    options.json = true;
  } else if (args[i] === '--brief') {
    options.brief = true;
  } else if (args[i] === '--count') {
    options.count = true;
  } else if (args[i] === '--desc') {
    options.desc = true;
  } else if (args[i] === '--stats') {
    showStats();
    process.exit(0);
  }
}

queryArticles(options);