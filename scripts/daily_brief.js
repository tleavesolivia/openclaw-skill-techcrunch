#!/usr/bin/env node
/**
 * Generate daily briefing from TechCrunch database
 */
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/tech-news.db');
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.error('better-sqlite3 not available');
  process.exit(1);
}

const db = new Database(DB_PATH);

// Get articles from last 48 hours
const hours = 48;
const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);
const articles = db.prepare(`
  SELECT DISTINCT title, link, author, pub_date, categories, description, feed_name 
  FROM tech_news 
  WHERE pub_date >= ? 
  ORDER BY pub_date DESC
`).all(startDate.toISOString());

// Filter unique articles by title
const seen = new Set();
const unique = articles.filter(a => {
  const key = a.title.substring(0, 60);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

// Output JSON for processing
console.log(JSON.stringify(unique, null, 2));
db.close();
