const fs = require('fs');

const filesToFix = [
  'DashboardView.jsx',
  'GuideView.jsx',
  'NexusView.jsx',
  'SettingsView.jsx',
  'SortieRapideView.jsx'
];

for (const file of filesToFix) {
  let content = fs.readFileSync(`src/components/${file}`, 'utf8');
  
  // Replace the first `<div className="space-y...` after `return (`
  content = content.replace(/return\s*\(\s*<div className="(space-y-[^"]+)">/, 'return (\n    <AnimatedPage className="$1">');
  
  fs.writeFileSync(`src/components/${file}`, content);
  console.log(`Fixed ${file}`);
}
