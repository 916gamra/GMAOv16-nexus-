const fs = require('fs');

let des = fs.readFileSync('src/components/DesignationView.jsx', 'utf8');
des = des.replace('[diagSearch, diagTypeFilter, sortField, sortOrder]', '[search, desigTypeFilter, sortField, sortOrder]');
fs.writeFileSync('src/components/DesignationView.jsx', des);

let tpl = fs.readFileSync('src/components/TemplatesView.jsx', 'utf8');
tpl = tpl.replace('[templateSearch, templateFamilyFilter, sortField, sortOrder]', '[search, templateFamilyFilter, sortField, sortOrder]');
fs.writeFileSync('src/components/TemplatesView.jsx', tpl);
console.log('Fixed');
