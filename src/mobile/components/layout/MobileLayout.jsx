import React from 'react';
import { MobileHeader } from './MobileHeader.jsx';
import { BottomNavigation } from './BottomNavigation.jsx';
import { PullToRefresh } from '../common/PullToRefresh.jsx';

/**
 * Main Mobile Page Layout Container.
 */
export function MobileLayout({
  title = 'GMAO Mobile',
  children,
  activeTab,
  onTabChange,
  onRefresh,
  onBack,
  rightHeaderAction,
  hideBottomNav = false,
  className = '',
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none pb-20 pt-14">
      {/* Top Header */}
      <MobileHeader
        title={title}
        onBack={onBack}
        rightAction={rightHeaderAction}
      />

      {/* Main Refreshable Viewport */}
      <main className={`flex-1 px-3 py-3 overflow-y-auto max-w-lg mx-auto w-full ${className}`}>
        {onRefresh ? (
          <PullToRefresh onRefresh={onRefresh}>
            {children}
          </PullToRefresh>
        ) : (
          children
        )}
      </main>

      {/* Bottom Floating Navigation */}
      {!hideBottomNav && (
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
}

export default MobileLayout;
