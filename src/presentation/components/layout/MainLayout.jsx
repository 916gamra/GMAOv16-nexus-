import { useEffect, useState, useCallback, useRef } from 'react';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import ContextMenu from '../common/ContextMenu';
import AutoSaveIndicator from '../common/AutoSaveIndicator';
import KeyboardShortcutsModal from '../common/KeyboardShortcutsModal';
import { keyboardShortcuts } from '../../../services/KeyboardShortcutsService';
import { useAuth } from '../../../context/AuthContext';

export default function MainLayout({
  children,
  currentTab,
  setCurrentTab,
  filters,
  navigation,
  counts,
  mobileMenuOpen,
  setMobileMenuOpen,
  fileInputRef,
  handleImportFile,
  handleExportExcel,
  linkedFileName,
  onDirectLink,
  onDirectSave,
}) {
  const { user, logout } = useAuth();
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Drag and Drop File Handlers (Window level)
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        // Synthesize standard change event for handleImportFile
        const syntheticEvent = {
          target: {
            files,
          },
        };
        handleImportFile(syntheticEvent);
      }
    },
    [handleImportFile]
  );

  // Global Keyboard Shortcuts Registry
  useEffect(() => {
    const unregisters = [
      keyboardShortcuts.registerShortcut({
        id: 'nav-dashboard',
        key: '1',
        label: 'Alt+1',
        description: 'Aller au Tableau de bord',
        category: 'navigation',
        alt: true,
        callback: () => setCurrentTab('dashboard'),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'nav-stock',
        key: '2',
        label: 'Alt+2',
        description: 'Aller au Stock PDR',
        category: 'navigation',
        alt: true,
        callback: () => setCurrentTab('stock'),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'nav-entrepot',
        key: '3',
        label: 'Alt+3',
        description: 'Aller à l’Entrepôt Parts',
        category: 'navigation',
        alt: true,
        callback: () => setCurrentTab('entrepot'),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'nav-machines',
        key: '4',
        label: 'Alt+4',
        description: 'Aller aux Machines Enregistrées',
        category: 'navigation',
        alt: true,
        callback: () => setCurrentTab('machines'),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'nav-users',
        key: '5',
        label: 'Alt+5',
        description: 'Aller aux Opérations & Chefs',
        category: 'navigation',
        alt: true,
        callback: () => setCurrentTab('utilisateurs'),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'nav-settings',
        key: '6',
        label: 'Alt+6',
        description: 'Aller aux Paramètres & Sécurité',
        category: 'navigation',
        alt: true,
        callback: () => setCurrentTab('settings'),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'action-save',
        key: 's',
        label: 'Ctrl+S',
        description: 'Sauvegarder directement dans le fichier lié',
        category: 'actions',
        ctrl: true,
        allowInInputs: true,
        callback: () => onDirectSave?.(),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'system-shortcuts-f1',
        key: 'F1',
        label: 'F1',
        description: 'Afficher la liste des raccourcis clavier',
        category: 'system',
        allowInInputs: true,
        callback: () => setShortcutsModalOpen((prev) => !prev),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'system-shortcuts-slash',
        key: '/',
        label: 'Ctrl+/',
        description: 'Afficher la liste des raccourcis clavier',
        category: 'system',
        ctrl: true,
        allowInInputs: true,
        callback: () => setShortcutsModalOpen((prev) => !prev),
      }),
      keyboardShortcuts.registerShortcut({
        id: 'system-escape',
        key: 'Escape',
        label: 'Échap',
        description: 'Fermer les menus et fenêtres modales',
        category: 'system',
        allowInInputs: true,
        callback: () => {
          setShortcutsModalOpen(false);
          setMobileMenuOpen(false);
        },
      }),
    ];

    return () => {
      unregisters.forEach((unreg) => unreg());
    };
  }, [setCurrentTab, onDirectSave, setMobileMenuOpen]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-screen bg-[#FAFAF9] text-zinc-900 flex flex-col relative isolate select-none font-sans antialiased"
    >
      {/* Drag & Drop Visual Dropzone Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-emerald-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-150 pointer-events-none">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/20 border-2 border-dashed border-emerald-400 flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <UploadCloud className="w-12 h-12 text-emerald-300" />
          </div>
          <h2 className="text-2xl font-black mb-2 tracking-tight">
            Glissez-déposez votre fichier ici
          </h2>
          <p className="text-sm text-emerald-200/90 max-w-md mb-4">
            Importation automatique et instantanée de vos classeurs Excel (<code>.xlsx</code>, <code>.xls</code>) ou sauvegardes JSON.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-500/30 text-xs font-mono text-emerald-200">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Format GMAO Light Twin V2 pris en charge</span>
          </div>
        </div>
      )}

      {/* Accessible Skip Link for Keyboard & Screen-reader navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-emerald-700 focus:text-white focus:rounded-full focus:shadow-xl focus:outline-hidden font-bold text-xs tracking-tight transition"
      >
        Passer directement au contenu principal
      </a>

      {/* Subtle Background Accent Glows */}
      <div className="fixed -top-32 -right-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-32 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Sticky Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        filters={filters}
        navigation={navigation}
        setMobileMenuOpen={setMobileMenuOpen}
        fileInputRef={fileInputRef}
        handleImportFile={handleImportFile}
        handleExportExcel={handleExportExcel}
        linkedFileName={linkedFileName}
        onDirectLink={onDirectLink}
        onDirectSave={onDirectSave}
        currentUser={user}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {/* Content Layout */}
      <div className="flex-1 flex w-full relative min-w-0">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          counts={counts}
          currentUser={user}
          onLogout={() => {
            try {
              localStorage.setItem('gmao_active_tab', 'dashboard');
            } catch {
              /* ignore */
            }
            setCurrentTab('dashboard');
            logout();
          }}
        />

        {/* Main Page Content - Full width layout with floating overlay sidebar */}
        <main
          id="main-content"
          role="main"
          tabIndex={-1}
          aria-label="Contenu principal"
          className="flex-1 p-3.5 sm:p-4 lg:p-6 w-full min-w-0 focus:outline-hidden"
        >
          {children}
        </main>
      </div>

      {/* Context Menu Global Portal */}
      <ContextMenu />

      {/* Live AutoSave Floating Indicator */}
      <AutoSaveIndicator />

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />
    </div>
  );
}
