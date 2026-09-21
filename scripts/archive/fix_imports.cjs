const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

function updateFileImports(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Let's just fix the paths in App.jsx first as a specific case.
  if (filePath.endsWith('App.jsx')) {
    content = content.replace(/from '\.\/components\/([a-zA-Z0-9_]+View)'/g, "from './presentation/pages/$1'");
    content = content.replace(/from '\.\/components\/LoginScreen'/g, "from './presentation/pages/LoginScreen'");
    content = content.replace(/from '\.\/components\/SplashScreen'/g, "from './presentation/pages/SplashScreen'");
    
    content = content.replace(/from '\.\/components\/Add([a-zA-Z0-9_]+)Modal'/g, "from './presentation/components/modals/Add$1Modal'");
    content = content.replace(/from '\.\/components\/EditArticleModal'/g, "from './presentation/components/modals/EditArticleModal'");
    content = content.replace(/from '\.\/components\/QuickMovementModal'/g, "from './presentation/components/modals/QuickMovementModal'");
    
    content = content.replace(/from '\.\/components\/Header'/g, "from './presentation/components/layout/Header'");
    content = content.replace(/from '\.\/components\/Sidebar'/g, "from './presentation/components/layout/Sidebar'");
    
    content = content.replace(/from '\.\/components\/([a-zA-Z0-9_]+)'/g, "from './presentation/components/common/$1'");
  }

  // Inside src/presentation/components/layout/MainLayout.jsx
  if (filePath.endsWith('MainLayout.jsx')) {
    content = content.replace(/from '\.\.\/\.\.\/\.\.\/components\/Sidebar'/g, "from './Sidebar'");
    content = content.replace(/from '\.\.\/\.\.\/\.\.\/components\/Header'/g, "from './Header'");
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

walkDir(root, updateFileImports);
console.log("App.jsx and MainLayout imports fixed.");
