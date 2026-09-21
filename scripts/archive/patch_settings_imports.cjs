const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.jsx', 'utf8');

// Add imports
const imports = `import { backupService } from '../utils/BackupService';
import { auditService } from '../utils/AuditService';
import { logger } from '../utils/Logger';
`;

code = code.replace("import { storageService } from '../utils/storageService';", "import { storageService } from '../utils/storageService';\n" + imports);

// Add Tab
const newTab = `            {
              id: 'backup-audit',
              label: 'Sauvegardes & Audit',
              sub: 'Historique & Restauration',
              icon: Clock,
              color: 'text-fuchsia-600',
              activeBg: 'bg-fuchsia-50/70',
              activeBorder: 'border-fuchsia-500',
              activeText: 'text-fuchsia-950',
              activeIconBg: 'bg-fuchsia-100/80',
            },
            {
              id: 'admin',`;
code = code.replace("            {\n              id: 'admin',", newTab);

fs.writeFileSync('src/components/SettingsView.jsx', code);
