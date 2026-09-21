const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const views = ['DashboardView', 'StockView', 'TypeView', 'DesignationView', 'MachinesRegisteredView', 'FamilyView', 'TemplatesView', 'ZonesView', 'UtilisateursView', 'SettingsView', 'SortieRapideView', 'GuideView', 'NexusView'];

views.forEach(view => {
    // First remove any existing ErrorBoundaries around them if we messed up
    const cleanupRegex = new RegExp(`<ErrorBoundary>(<${view}[\\s\\S]*?<\\/${view}>|<${view}[\\s\\S]*?\\/>)<\\/ErrorBoundary>`, 'g');
    code = code.replace(cleanupRegex, '$1');
    
    // Now correctly wrap them
    const wrapRegex = new RegExp(`(<${view}\\b[\\s\\S]*?(?:\\/>|<\\/${view}>))`, 'g');
    code = code.replace(wrapRegex, '<ErrorBoundary>\n$1\n</ErrorBoundary>');
});

fs.writeFileSync('src/App.jsx', code);
