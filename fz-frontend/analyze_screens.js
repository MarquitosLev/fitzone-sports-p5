const fs = require('fs');
const path = require('path');

const dir = './temp_figma';
const files = fs.readdirSync(dir);

const summary = {};

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // Simple regex to extract visible texts inside <span> or <div>
  const texts = [];
  const textMatches = content.matchAll(/>([^<]+)</g);
  for (const match of textMatches) {
    const t = match[1].trim();
    if (t && !t.startsWith('<!--') && !t.startsWith('{') && t.length > 1) {
      texts.push(t);
    }
  }
  // Deduplicate sequential or common texts
  const uniqueTexts = [...new Set(texts)];
  summary[file] = uniqueTexts;
});

fs.writeFileSync('screens_summary.json', JSON.stringify(summary, null, 2));
console.log('Summary created. Total screens:', Object.keys(summary).length);
