/**
 * TechCrunch Query Script (Cloud Version)
 * Fetches data from cloud API instead of local database
 */

const https = require('https');
const http = require('http');

// Point this at your own API server, or set the CLOUD_API_BASE env var
const API_BASE = process.env.CLOUD_API_BASE || 'http://YOUR_API_SERVER:3000';

// Fetch from cloud API
async function fetchFromCloud(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http;
    client.get(url.toString(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Get articles from cloud
async function getArticles(options = {}) {
  const { hours, keyword, limit } = options;
  
  const params = {};
  if (hours) params.hours = hours;
  if (keyword) params.keyword = keyword;
  if (limit) params.limit = limit;
  
  try {
    const result = await fetchFromCloud('/api/techcrunch', params);
    return result.articles || [];
  } catch (err) {
    console.error(`Error fetching from cloud: ${err.message}`);
    return [];
  }
}

// Format article for display
function formatArticle(article, index) {
  const date = new Date(article.pub_date).toLocaleString('zh-CN', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
  
  return `${index + 1}. **${article.title}**
   - ä½œè€…: ${article.author || 'N/A'}
   - æ—¶é—´: ${date}
   - åˆ†ç±»: ${article.categories || 'N/A'}
   - é“¾æŽ¥: ${article.link}
   - æ‘˜è¦: ${article.description || 'N/A'}
`;
}

// Main query function
async function query(options) {
  const articles = await getArticles(options);
  
  if (articles.length === 0) {
    console.log('æœªæ‰¾åˆ°ç›¸å…³æ–‡ç« ã€‚');
    return;
  }
  
  console.log(`\n=== TechCrunch æ–‡ç«  (${articles.length} æ¡) ===\n`);
  
  for (let i = 0; i < Math.min(articles.length, 20); i++) {
    console.log(formatArticle(articles[i], i));
  }
  
  if (articles.length > 20) {
    console.log(`... è¿˜æœ‰ ${articles.length - 20} æ¡æ–‡ç« æœªæ˜¾ç¤º`);
  }
  
  // Output JSON for AI processing if requested
  if (options.json) {
    console.log('\n=== JSON Output ===');
    const jsonOutput = articles.slice(0, 50).map(a => ({
      title: a.title,
      author: a.author,
      date: a.pub_date,
      categories: a.categories,
      link: a.link,
      description: a.description
    }));
    console.log(JSON.stringify(jsonOutput, null, 2));
  }
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
  }
}

query(options);