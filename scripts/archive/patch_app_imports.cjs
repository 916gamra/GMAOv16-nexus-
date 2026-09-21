const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const newImports = `
import { validateImportedData } from './utils/validation';
import { backupService } from './utils/BackupService';
import { auditService } from './utils/AuditService';
import { logger } from './utils/Logger';
import { monitor } from './utils/PerformanceMonitor';
`;

code = code.replace("import ErrorBoundary from './components/ErrorBoundary';", "import ErrorBoundary from './components/ErrorBoundary';\n" + newImports);

fs.writeFileSync('src/App.jsx', code);
