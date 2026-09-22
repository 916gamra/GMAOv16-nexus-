import FloatingSidebar from './FloatingSidebar';
import MobileSidebarDrawer from './MobileSidebarDrawer';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  counts,
  currentUser,
  fileInputRef,
  handleImportFile,
  handleExportExcel,
  onLogout,
}) {
  return (
    <>
      {/* Desktop Floating Icon Sidebar (72px wide floating pill) */}
      <FloatingSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onLogout={onLogout}
      />

      {/* Mobile Drawer (100% Original Full Rich Sidebar with Ciob PDR XLS, Badges, Tip Box & Controls) */}
      <MobileSidebarDrawer
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        counts={counts}
        currentUser={currentUser}
        fileInputRef={fileInputRef}
        handleImportFile={handleImportFile}
        handleExportExcel={handleExportExcel}
        onLogout={onLogout}
      />
    </>
  );
}
