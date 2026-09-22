import { useState } from 'react';
import MobileDashboardView from './MobileDashboardView';
import MobileStockView from './MobileStockView';
import MobileMachinesView from './MobileMachinesView';
import MobilePreventiveView from './MobilePreventiveView';
import MobileQuickSortieModal from '../components/modals/MobileQuickSortieModal';

export default function MobileContainer({
  currentTab,
  setCurrentTab,
  stockItems = [],
  machines = [],
  zones = [],
  technicians = [],
  preventiveTasks = [],
  onMarkTaskDone,
  onAddMouvement,
  showToast,
  linkedFileName,
  onDirectSave,
  children, // Desktop children fallback for other tabs (e.g. settings, zones)
}) {
  const [quickSortieOpen, setQuickSortieOpen] = useState(false);
  const [selectedArticleForSortie, setSelectedArticleForSortie] = useState(null);

  const handleOpenQuickSortie = (article = null) => {
    setSelectedArticleForSortie(article);
    setQuickSortieOpen(true);
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <MobileDashboardView
            stockItems={stockItems}
            machines={machines}
            preventiveTasks={preventiveTasks}
            onNavigateTab={setCurrentTab}
            onOpenQuickSortie={() => handleOpenQuickSortie(null)}
            linkedFileName={linkedFileName}
            onDirectSave={onDirectSave}
          />
        );

      case 'stock':
      case 'articles':
      case 'pdr':
        return (
          <MobileStockView
            stockItems={stockItems}
            onOpenQuickSortie={handleOpenQuickSortie}
          />
        );

      case 'machines':
        return (
          <MobileMachinesView
            machines={machines}
            zones={zones}
            onNavigateTab={setCurrentTab}
          />
        );

      case 'preventive':
        return (
          <MobilePreventiveView
            preventiveTasks={preventiveTasks}
            onMarkTaskDone={onMarkTaskDone}
            showToast={showToast}
          />
        );

      default:
        // For settings, nexus, zones or other modules, display the standard view
        return <div className="animate-in fade-in duration-200">{children}</div>;
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {renderCurrentView()}

      {/* Quick Sortie Modal */}
      <MobileQuickSortieModal
        isOpen={quickSortieOpen}
        onClose={() => {
          setQuickSortieOpen(false);
          setSelectedArticleForSortie(null);
        }}
        stockItems={stockItems}
        machines={machines}
        technicians={technicians}
        initialArticle={selectedArticleForSortie}
        onAddMouvement={onAddMouvement}
        showToast={showToast}
      />
    </div>
  );
}
