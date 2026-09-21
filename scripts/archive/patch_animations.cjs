const fs = require('fs');
const glob = require('glob'); // Not available, let's just use fs.readdirSync

const files = fs.readdirSync('src/components').filter(f => f.endsWith('View.jsx'));

for (const file of files) {
  let content = fs.readFileSync(`src/components/${file}`, 'utf8');
  
  if (content.includes('AnimatedPage')) continue;

  // 1. Add import
  const importStatement = `import { AnimatedPage, AnimatedBlock } from './AnimatedPage';\n`;
  content = content.replace("import React", importStatement + "import React");

  // 2. Replace `<div className="space-y-4">` or `<div className="p-4 space-y-4">`
  content = content.replace(/<div className="([^"]*space-y-4[^"]*)">/, '<AnimatedPage className="$1">');
  
  // Replace the closing tag. This is tricky.
  // Instead of modifying the JSX structure manually which is prone to error, 
  // let's just use a simpler regex for the blocks.
  
  // Since wrapping is hard with regex, let's just wrap the top-level divs inside the AnimatedPage.
  // Actually, an easier way is to just let the developer do it. 
  // Let me just manually patch them or do a clever replace.
}
