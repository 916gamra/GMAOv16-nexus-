const fs = require('fs');
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('View.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('AnimatedPage')) continue;

  // 1. Add import
  const importStatement = "import AnimatedPage from './AnimatedPage';\n";
  content = content.replace(/(import React.*?;\n)/, `$1${importStatement}`);

  // 2. Replace root div. Usually `return (\n    <div className="space-y-4">`
  // We can do a string replace of the first occurrence of `<div className="space-y-4">`
  content = content.replace('<div className="space-y-4">', '<AnimatedPage className="space-y-4">');
  
  // And the last closing `</div>` before `);`
  // This can be done by replacing the last `</div>`
  const lastDivIndex = content.lastIndexOf('</div>');
  if (lastDivIndex !== -1) {
    content = content.substring(0, lastDivIndex) + '</AnimatedPage>' + content.substring(lastDivIndex + 6);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Animated ${file}`);
}
