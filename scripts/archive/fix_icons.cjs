const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, 'src', 'presentation', 'components', 'layout', 'Sidebar.jsx');
let content = fs.readFileSync(sidebarPath, 'utf8');
content = content.replace(/from '\.\/icons\//g, "from '../common/icons/");
fs.writeFileSync(sidebarPath, content, 'utf8');

const typeViewPath = path.join(__dirname, 'src', 'presentation', 'pages', 'TypeView.jsx');
let content2 = fs.readFileSync(typeViewPath, 'utf8');
content2 = content2.replace(/from '\.\/icons\//g, "from '../components/common/icons/");
fs.writeFileSync(typeViewPath, content2, 'utf8');

console.log("Icons paths fixed.");
