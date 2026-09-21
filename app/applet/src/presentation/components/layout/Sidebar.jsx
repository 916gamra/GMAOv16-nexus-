import FloatingSidebar from './FloatingSidebar';
import MobileSidebarDrawer from './MobileSidebarDrawer';

export default function Sidebar({
  currentTab,
  setCurrentTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  counts,
  currentUser,
  onLogout,
}) {
  return (
    <>
      {/* Desktop Floating Icon Sidebar (72px wide floating pill) */}
      <FloatingSidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Mobile Drawer (100% Original Full Rich Sidebar when opening mobile menu) */}
      <MobileSidebarDrawer
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        counts={counts}
        currentUser={currentUser}
        onLogout={onLogout}
      />
    </>
  );
}
