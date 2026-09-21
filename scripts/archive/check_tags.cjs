const fs = require('fs');
const files = fs.readdirSync('src/components').filter(f => f.endsWith('View.jsx'));

for (const file of files) {
  const content = fs.readFileSync(`src/components/${file}`, 'utf8');
  const opens = (content.match(/<AnimatedPage/g) || []).length;
  const closes = (content.match(/<\/AnimatedPage>/g) || []).length;
  if (opens !== closes) {
    console.log(`Mismatch in ${file}: opens ${opens}, closes ${closes}`);
  }
}
