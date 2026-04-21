/**
 * TechCrunch News Query Script
 * Search, filter, and summarize articles
 */

const fs = require('fs');
const path = require('path');

// Try to load better-sqlite3
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.log('Warning: better-sqlite3 not available, using JSON storage');
}

const DB_PATH = path.join(__dirname, '../data/tech-news.db');
const JSON_PATH = path.join(__dirname, '../data/tech-news.json');

// Get articles from database
function getArticles(options = {}) {
  const { hours, keyword, category, limit } = options;
  
  if (Database && fs.existsSync(DB_PATH)) {
    const db = new Database(DB_PATH);
    
    let query = 'SELECT * FROM tech_news WHERE 1=1';
    const params = [];
    
    if (hours) {
      const cutoff = new Date(Date.now() - hours * 3600000).toISOString();
      query += ' AND pub_date >= ?';
      params.push(cutoff);
    }
    
    if (keyword) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (category) {
      query += ' AND categories LIKE ?';
      params.push(`%${category}%`);
    }
    
    query += ' ORDER BY pub_date DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const articles = db.prepare(query).all(...params);
    db.close();
    return articles;
  } else if (fs.existsSync(JSON_PATH)) {
    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    let articles = data.articles;
    
    if (hours) {
      const cutoff = new Date(Date.now() - hours * 3600000);
      articles = articles.filter(a => new Date(a.pub_date) >= cutoff);
    }
    
    if (keyword) {
      const kw = keyword.toLowerCase();
      articles = articles.filter(a => 
        a.title.toLowerCase().includes(kw) || 
        a.description.toLowerCase().includes(kw)
      );
    }
    
    if (category) {
      articles = articles.filter(a => a.categories.toLowerCase().includes(category.toLowerCase()));
    }
    
    articles.sort((a, b) => new Date(b.pub_date) - new Date(a.pub_date));
    
    if (limit) {
      articles = articles.slice(0, limit);
    }
    
    return articles;
  }
  
  return [];
}

// Format article for display
function formatArticle(article, index) {
  const date = new Date(article.pub_date).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
  
  return `${index + 1}. **${article.title}**
   - Author: ${article.author || 'N/A'}
   - Date: ${date}
   - Categories: ${article.categories}
   - Link: ${article.link}
   - Summary: ${article.description || 'N/A'}
`;
}

// Main query function
function query(options) {
  const articles = getArticles(options);
  
  if (articles.length === 0) {
    console.log('No articles found.');
    return;
  }
  
  console.log(`\n=== TechCrunch Articles (${articles.length} found) ===\n`);
  
  for (const article of articles) {
    console.log(formatArticle(article, articles.indexOf(article)));
  }
  
  // Output JSON for AI processing if requested
  if (options.json) {
    console.log('\n=== JSON Output ===');
    console.log(JSON.stringify(articles, null, 2));
  }
}

// Generate summary for AI
function generateSummary(hours = 24) {
  const articles = getArticles({ hours, limit: 50 });
  
  if (articles.length === 0) {
    console.log('No articles in the specified time range.');
    return;
  }
  
  // Group by category
  const byCategory = {};
  for (const article of articles) {
    const cats = article.categories.split(',');
    for (const cat of cats) {
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(article);
    }
  }
  
  // Output structured data for AI to summarize
  const summaryData = {
    timeRange: `Last ${hours} hours`,
    totalArticles: articles.length,
    categories: Object.keys(byCategory).sort((a, b) => byCategory[b].length - byCategory[a].length).slice(0, 10),
    articles: articles.map(a => ({
      title: a.title,
      author: a.author,
      date: a.pub_date,
      categories: a.categories.split(','),
      summary: a.description
    }))
  };
  
  console.log(JSON.stringify(summaryData, null, 2));
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
  } else if (args[i] === '--category' && args[i + 1]) {
    options.category = args[i + 1];
    i++;
  } else if (args[i] === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--json') {
    options.json = true;
  } else if (args[i] === '--summary') {
    options.summary = true;
  }
}

if (options.summary) {
  generateSummary(options.hours || 24);
} else {
  query(options);
}