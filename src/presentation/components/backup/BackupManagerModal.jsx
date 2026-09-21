import { useState, useEffect, useRef } from 'react';
import {
  X,
  Database,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { AutoBackupService } from '../../../core/backup/AutoBackupService.js';
import { usePermission } from '../common/PermissionGate.jsx';

export default function BackupManagerModal({ isOpen, onClose, onDataRestored }) {
  const [snapshots, setSnapshots] = useState([]);
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const canBackup = usePermission('settings.backup');
  const canRestore = usePermission('settings.restore');

  const refreshList = () => {
    setSnapshots(AutoBackupService.listSnapshots());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSuccessMsg('');
      setErrorMsg('');
      setConfirmRestoreId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateManual = () => {
    const snap = AutoBackupService.createSnapshot('Sauvegarde manuelle utilisateur', true);
    if (snap) {
      setSuccessMsg('Point de restauration créé avec succès !');
      refreshList();
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg('Échec de création du point de restauration.');
    }
  };

  const handleExecuteRestore = (id) => {
    setIsRestoring(true);
    setTimeout(() => {
      const ok = AutoBackupService.restoreSnapshot(id);
      setIsRestoring(false);
      setConfirmRestoreId(null);
      if (ok) {
        setSuccessMsg('Données restaurées avec succès ! Actualisation...');
        refreshList();
        if (onDataRestored) {
          onDataRestored();
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        setErrorMsg('Erreur lors de la restauration du point.');
      }
    }, 300);
  };

  const handleDelete = (id) => {
    AutoBackupService.deleteSnapshot(id);
    refreshList();
  };

  const handleExportFull = () => {
    AutoBackupService.exportFullBackupJSON();
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        const ok = AutoBackupService.importFullBackupJSON(text);
        if (ok) {
          setSuccessMsg('Sauvegarde importée avec succès !');
          refreshList();
          if (onDataRestored) onDataRestored();
        } else {
          setErrorMsg('Fichier de sauvegarde invalide.');
        }
      } catch {
        setErrorMsg('Erreur de lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-xs">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Gestionnaire de Sauvegardes & Restauration</h2>
              <p className="text-[11px] text-slate-400 font-mono">Points de restauration automatiques • 100% Offline</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canBackup}
              onClick={handleCreateManual}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Créer un point maintenant</span>
            </button>

            <button
              type="button"
              onClick={handleExportFull}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Télécharger toutes les données au format JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter JSON</span>
            </button>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              type="button"
              disabled={!canRestore}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-40"
              title="Restaurer à partir d'un fichier .json externe"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Importer JSON</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-800 shrink-0 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Snapshots List */}
        <div className="p-4 overflow-y-auto space-y-2.5 grow">
          {snapshots.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-medium">Aucun point de restauration enregistré.</p>
              <p className="text-[11px] text-slate-400">
                Cliquez sur "Créer un point maintenant" ou effectuez des modifications pour en générer un automatiquement.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => {
              const totalItems = Object.values(snap.counts || {}).reduce((acc, c) => acc + (Number(c) || 0), 0);
              const isConfirming = confirmRestoreId === snap.id;

              return (
                <div
                  key={snap.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isConfirming
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {snap.dateStr}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            snap.isManual
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {snap.isManual ? 'Manuel' : 'Automatique'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{snap.reason}</span>
                      </div>

                      {/* Counts breakdown */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-slate-500 pt-0.5">
                        <span>PDR: <b>{snap.counts?.spare_parts ?? 0}</b></span>
                        <span>•</span>
                        <span>Mouvements: <b>{snap.counts?.movements ?? 0}</b></span>
                        <span>•</span>
                        <span>Machines: <b>{snap.counts?.machines ?? 0}</b></span>
                        <span>•</span>
                        <span>Total: <b>{totalItems}</b> enregistrements</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5 bg-amber-100 p-1.5 rounded-xl border border-amber-300 animate-in fade-in">
                          <span className="text-[10px] font-bold text-amber-900 px-1">Confirmer ?</span>
                          <button
                            type="button"
                            disabled={isRestoring}
                            onClick={() => handleExecuteRestore(snap.id)}
                            className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            {isRestoring ? 'Restauration...' : 'Oui, restaurer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmRestoreId(null)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={!canRestore}
                            onClick={() => setConfirmRestoreId(snap.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                            title="Restaurer l'application à cet instant"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Restaurer</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canBackup}
                            onClick={() => handleDelete(snap.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-40"
                            title="Supprimer ce point"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Historique limité aux 10 derniers points pour préserver l'espace disque local.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
