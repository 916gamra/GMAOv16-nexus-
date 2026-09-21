const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add ErrorBoundary import
if (!code.includes("import ErrorBoundary")) {
    code = code.replace("import Toast from './components/Toast';", "import Toast from './components/Toast';\nimport ErrorBoundary from './components/ErrorBoundary';");
}

// Replace view renders with ErrorBoundary wrapper
const views = ['DashboardView', 'StockView', 'TypeView', 'DesignationView', 'MachinesRegisteredView', 'FamilyView', 'TemplatesView', 'ZonesView', 'UtilisateursView', 'SettingsView', 'SortieRapideView', 'GuideView', 'NexusView'];

views.forEach(view => {
    const regex = new RegExp(`(<${view}[^>]*/>|<${view}[^>]*>[\\s\\S]*?</${view}>)`, 'g');
    code = code.replace(regex, `<ErrorBoundary>$1</ErrorBoundary>`);
});

fs.writeFileSync('src/App.jsx', code);
