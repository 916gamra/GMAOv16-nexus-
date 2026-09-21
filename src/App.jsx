import {
  useState,
  useRef,
  useEffect,
} from 'react';
import { useGmaoState } from './hooks/useGmaoState';
import { useAppCalculations } from './hooks/useAppCalculations';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppExcelOperations } from './hooks/useAppExcelOperations';
import { useAppModals } from './hooks/useAppModals';
import { useAppEntityActions } from './hooks/useAppEntityActions';

import { SplashScreen, LoginScreen } from './presentation/pages/auth';
import OfflineIndicator from './presentation/components/common/OfflineIndicator';
import ErrorBoundary from './presentation/components/common/ErrorBoundary';
import RuntimeErrorModal from './presentation/components/common/RuntimeErrorModal';

import { backupService } from './utils/BackupService';
import { Logger } from './core/logger/LoggerService';
import { monitor } from './utils/PerformanceMonitor';

import { useAuth } from './context/AuthContext';
import MainLayout from './presentation/components/layout/MainLayout';
import AppModals from './presentation/modals/AppModals';
import AppRouter from './presentation/router/AppRouter';
import { useAppRouterProps } from './presentation/router/useAppRouterProps';
import PreventiveService from './application/services/PreventiveService';

export default function App() {
  const { user: currentUser } = useAuth();

  // Splash & Auth States - Display splash screen once per browser session
  const [showSplash, setShowSplash] = useState(() => {
    try {
      return !sessionStorage.getItem('gmao_splash_shown');
    } catch {
      return true;
    }
  });

  const handleSplashComplete = () => {
    setShowSplash(false);
    try {
      sessionStorage.setItem('gmao_splash_shown', 'true');
    } catch {}
  };

  // Toast State
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { message: '', type: 'success' } : prev));
    }, 4500);
  };

  // Navigation Tab State - Defaults to 'dashboard', persists active tab while logged in
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      return localStorage.getItem('gmao_active_tab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });

  useEffect(() => {
    try {
      if (currentTab) {
        localStorage.setItem('gmao_active_tab', currentTab);
      }
    } catch {
      /* ignore storage error */
    }
  }, [currentTab]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Core Data States
  const gmaoState = useGmaoState();
  const {
    types,
    designations,
    families,
    templates,
    blueprints,
    machines,
    warehouseItems,
    entrepotComponents,
    zones,
    technicians,
    operations,
    mouvements,
    rawStock,
    compGroups,
    compFamilies,
    compTemplates,
    partTypes,
    partDesignations,
  } = gmaoState;

  // Auto Backup and Performance Monitor Initialization
  const backupDataRef = useRef({});
  useEffect(() => {
    backupDataRef.current = {
      currentUser,
      rawStock,
      mouvements,
      machines,
      warehouseItems,
      families,
      templates,
      zones,
      designations,
      types,
      technicians,
      operations,
    };
  }, [
    currentUser,
    rawStock,
    mouvements,
    machines,
    warehouseItems,
    families,
    templates,
    zones,
    designations,
    types,
    technicians,
    operations,
  ]);

  useEffect(() => {
    Logger.info('Application started');
    monitor.measure('App_Init', () => {
      backupService.startAutoBackup(() => {
        const d = backupDataRef.current || {};
        return {
          Stock_Actuel: d.rawStock,
          Mouvement: d.mouvements,
          Machines_Registered: d.machines,
          Warehouse_Items: d.warehouseItems,
          Families: d.families,
          Templates: d.templates,
          Zones: d.zones,
          Diagnostics: d.designations,
          Types: d.types,
          Technicians: d.technicians,
          Operations: d.operations,
        };
      }, backupDataRef.current?.currentUser?.name || backupDataRef.current?.currentUser?.nom || 'system');
    });

    return () => {
      backupService.stopAutoBackup();
    };
  }, []);

  // Calculations: Real-time stock status, fallbacks, warehouse totals, KPIs
  const {
    stockItems,
    effectiveDesignations,
    effectiveFamilies,
    effectiveTemplates,
    diagnostics,
    warehouseItemsComputed,
    stockKPIs,
  } = useAppCalculations({
    rawStock,
    mouvements,
    designations,
    families,
    templates,
    warehouseItems,
  });

  // Smart Navigation & Filter States
  const { filters, navigation } = useAppNavigation({ setCurrentTab });

  // Modal States
  const modals = useAppModals();

  // Consolidated Entity Actions
  const entityActions = useAppEntityActions({
    gmaoState,
    showToast,
    setCurrentTab,
  });

  // Excel & File System Direct Operations
  const {
    linkedFileName,
    handleExportExcel,
    handleImportFile,
    handleDirectFileLink,
    handleDirectSave,
  } = useAppExcelOperations({
    state: gmaoState,
    stockItems,
    diagnostics,
    showToast,
    fileInputRef,
  });

  const routerProps = useAppRouterProps({
    setCurrentTab,
    stockItems,
    machines,
    warehouseItemsComputed,
    mouvements,
    types,
    diagnostics,
    zones,
    technicians,
    operations,
    stockKPIs,
    filters,
    navigation,
    effectiveFamilies,
    effectiveTemplates,
    blueprints,
    compGroups,
    compFamilies,
    compTemplates,
    entrepotComponents,
    partTypes,
    partDesignations,
    rawStock,
    designations,
    families,
    templates,
    modals,
    handlers: entityActions,
  });

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <ErrorBoundary>
      <MainLayout
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        filters={filters}
        navigation={navigation}
        counts={{
          stock: stockItems.length,
          types: types.length,
          designations: effectiveDesignations.length,
          diagnostics: effectiveDesignations.length,
          machines: machines.length,
          families: effectiveFamilies.length,
          templates: effectiveTemplates.length,
          blueprints: (blueprints || []).length,
          preventive: PreventiveService.getTasks().length || 1175,
          warehouse: warehouseItemsComputed.length,
          entrepot: (entrepotComponents || []).length,
          comp_groups: (compGroups || []).length,
          compGroups: (compGroups || []).length,
          comp_families: (compFamilies || []).length,
          compFamilies: (compFamilies || []).length,
          comp_templates: (compTemplates || []).length,
          compTemplates: (compTemplates || []).length,
          partTypes: (partTypes || []).length,
          partDesignations: (partDesignations || []).length,
          zones: zones.length,
          technicians: technicians.length,
          operations: operations.length,
        }}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        fileInputRef={fileInputRef}
        handleImportFile={handleImportFile}
        handleExportExcel={handleExportExcel}
        linkedFileName={linkedFileName}
        onDirectLink={handleDirectFileLink}
        onDirectSave={handleDirectSave}
      >
        <AppRouter
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          props={routerProps}
        />

        <AppModals
          {...modals}
          types={types}
          stockItems={stockItems}
          effectiveFamilies={effectiveFamilies}
          effectiveTemplates={effectiveTemplates}
          blueprints={blueprints}
          zones={zones}
          technicians={technicians}
          machines={machines}
          operations={operations}
          handleAddArticle={entityActions.handleAddArticle}
          handleAddMachine={entityActions.handleAddMachine}
          handleUpdateMachine={entityActions.handleUpdateMachine}
          handleDeleteMachine={entityActions.handleDeleteMachine}
          handleAddTechnician={entityActions.handleAddTechnician}
          handleAddOperation={entityActions.handleAddOperation}
          handleAddZone={entityActions.handleAddZone}
          setCurrentTab={setCurrentTab}
          toast={toast}
          setToast={setToast}
        />

        {/* 100% Offline Status Indicator */}
        <OfflineIndicator />

        {/* Global Runtime Error System Modal */}
        <RuntimeErrorModal />
      </MainLayout>
    </ErrorBoundary>
  );
}
