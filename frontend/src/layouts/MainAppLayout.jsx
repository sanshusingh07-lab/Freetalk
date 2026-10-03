import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/navigation/Navbar.jsx';
import { LeftSidebar } from '../components/navigation/LeftSidebar.jsx';
import { RightSidebar } from '../components/navigation/RightSidebar.jsx';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { AIAssistantWidget } from '../components/ai/AIAssistantWidget.jsx';

export function MainAppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // The Right Sidebar (user profile & trending topics) is only displayed on the Home feed
  const isHomePage = location.pathname === '/home' || location.pathname === '/home/';

  return (
    <div className="min-h-screen flex flex-col bg-paper-50 dark:bg-ink-900 text-ink-900 dark:text-paper-100 selection:bg-terracotta-500 selection:text-white font-sans antialiased pb-16 md:pb-0">
      <Navbar onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 flex gap-8">
        {/* Left Navigation Sidebar (Desktop) */}
        <div className="hidden md:block">
          <LeftSidebar className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto" />
        </div>

        {/* Center Main Content Feed */}
        <main className="flex-1 min-w-0 py-6">
          <Outlet />
        </main>

        {/* Right Sidebar - Displayed on Home page only */}
        {isHomePage && (
          <div className="hidden xl:block">
            <RightSidebar className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto" />
          </div>
        )}
      </div>

      {/* Mobile Drawer Navigation */}
      <Modal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Navigation Menu"
        maxWidth="max-w-xs"
      >
        <LeftSidebar onItemClick={() => setIsMobileMenuOpen(false)} />
      </Modal>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenMenu={() => setIsMobileMenuOpen(true)} />

      {/* In-Built AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}
