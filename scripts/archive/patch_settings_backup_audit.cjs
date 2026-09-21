const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsView.jsx', 'utf8');

const backupAuditLogic = `
  const [backupsList, setBackupsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (activeTab === 'backup-audit') {
      loadBackups();
      loadAuditLogs();
    }
  }, [activeTab]);

  const loadBackups = async () => {
    try {
      const list = await backupService.getBackupsList();
      setBackupsList(list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const list = await auditService.getLog();
      setAuditLogs(list || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleRestoreBackup = async (id) => {
    if (!window.confirm('Attention : Cette action va écraser toutes vos données actuelles. Confirmer ?')) return;
    try {
      const data = await backupService.restoreBackup(id);
      if (data.Stock_Actuel) setRawStock(data.Stock_Actuel);
      if (data.Mouvement) setMouvements(data.Mouvement);
      if (data.Machines_Registered) setMachines(data.Machines_Registered);
      if (data.Families) setFamilies(data.Families);
      if (data.Templates) setTemplates(data.Templates);
      if (data.Zones) setZones(data.Zones);
      if (data.Technicians) setTechnicians(data.Technicians);
      if (data.Operations) setOperations(data.Operations);
      showToast('Restauration réussie !', 'success');
      logger.info('Backup restored manually', { backupId: id });
    } catch (e) {
      showToast('Erreur lors de la restauration.', 'error');
    }
  };

  const handleExportBackup = async (id) => {
    try {
      await backupService.exportBackup(id);
      showToast('Export réussi !', 'success');
    } catch (e) {
      showToast('Erreur lors de l\\'export.', 'error');
    }
  };

  const getAuditLabel = () => {`;

code = code.replace("  const getAuditLabel = () => {", backupAuditLogic);

const backupAuditPanel = `
        {/* PANEL: SAUVEGARDES & AUDIT */}
        {activeTab === 'backup-audit' && (
          <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-fuchsia-600 shrink-0" />
                  Sauvegardes et Journal d'Audit
                </h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Gérez vos points de restauration locaux et consultez l'historique complet des actions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Backups Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Points de Restauration
                  </h4>
                  <button onClick={loadBackups} className="text-xs text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1 font-bold cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2">Date & Heure</th>
                        <th className="px-4 py-2">Utilisateur</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {backupsList.length === 0 ? (
                        <tr><td colSpan="3" className="px-4 py-6 text-center text-slate-500">Aucune sauvegarde disponible</td></tr>
                      ) : backupsList.map(b => (
                        <tr key={b.id} className="hover:bg-white transition-colors">
                          <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px]">{new Date(b.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-2.5 truncate max-w-[100px]">{b.userId}</td>
                          <td className="px-4 py-2.5 text-right flex items-center justify-end gap-2">
                             <button onClick={() => handleExportBackup(b.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Exporter en JSON">
                               <Download className="w-3.5 h-3.5" />
                             </button>
                             <button onClick={() => handleRestoreBackup(b.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" title="Restaurer cette version">
                               <RotateCcw className="w-3.5 h-3.5" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Column */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Journal des Événements
                  </h4>
                  <button onClick={loadAuditLogs} className="text-xs text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1 font-bold cursor-pointer">
                    <RefreshCw className={\`w-3.5 h-3.5 \${loadingAudit ? 'animate-spin' : ''}\`} /> Actualiser
                  </button>
                </div>
                
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="max-h-[350px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-2">Horodatage</th>
                          <th className="px-4 py-2">Action</th>
                          <th className="px-4 py-2">Cible</th>
                          <th className="px-4 py-2">Acteur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {auditLogs.length === 0 ? (
                          <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-500">Aucun événement enregistré</td></tr>
                        ) : [...auditLogs].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 100).map(log => (
                          <tr key={log.id} className="hover:bg-white transition-colors">
                            <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[10px] text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={\`px-1.5 py-0.5 rounded text-[10px] font-bold \${
                                log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                                log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' :
                                'bg-slate-200 text-slate-700'
                              }\`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-slate-700 truncate max-w-[100px]" title={log.entityId}>
                              {log.entity} <span className="font-normal text-slate-400 font-mono text-[10px]">({log.entityId})</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-600 truncate max-w-[80px]">{log.userId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {auditLogs.length > 100 && (
                    <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-100 border-t border-slate-200">
                      Affichage limité aux 100 derniers événements
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 6: ADMIN ACCOUNT & SECURITY SETTINGS */}`;

code = code.replace("        {/* PANEL 6: ADMIN ACCOUNT & SECURITY SETTINGS */}", backupAuditPanel);

fs.writeFileSync('src/components/SettingsView.jsx', code);
