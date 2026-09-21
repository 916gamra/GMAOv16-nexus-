const fs = require('fs');

let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace all setCurrentTab('...') with React.startTransition(() => setCurrentTab('...'))
// Wait, we need to be careful not to double wrap.
if (!content.includes('startTransition')) {
  content = content.replace(/setCurrentTab\(([^)]+)\)/g, 'React.startTransition(() => setCurrentTab($1))');
  fs.writeFileSync('src/App.jsx', content);
  console.log('App.jsx patched with startTransition');
}

