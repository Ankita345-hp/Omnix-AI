import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NewInteractionModal } from './components/NewInteractionModal';

import { Dashboard } from './pages/Dashboard';
import { JourneyMap } from './pages/JourneyMap';
import { InteractionQueue } from './pages/InteractionQueue';
import { InteractionDetail } from './pages/InteractionDetail';
import { Analytics } from './pages/Analytics';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newInteractionModalOpen, setNewInteractionModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        {/* Desktop Sidebar & Mobile Drawer */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Main Content Area (Offset by sidebar width on lg+ screens) */}
        <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
          {/* Top Navbar */}
          <Navbar
            onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
            onOpenNewInteraction={() => setNewInteractionModalOpen(true)}
            globalSearch={globalSearch}
            onGlobalSearchChange={setGlobalSearch}
          />

          {/* Main Content View */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <Dashboard
                    onOpenNewInteraction={() => setNewInteractionModalOpen(true)}
                    globalSearch={globalSearch}
                  />
                }
              />
              <Route path="/journey" element={<JourneyMap />} />
              <Route
                path="/interactions"
                element={
                  <InteractionQueue
                    onOpenNewInteraction={() => setNewInteractionModalOpen(true)}
                    globalSearch={globalSearch}
                  />
                }
              />
              <Route path="/interactions/:id" element={<InteractionDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation Bar (Visible on mobile/Android viewports) */}
          <MobileBottomNav />
        </div>

        {/* Omnichannel Ingestion Modal */}
        <NewInteractionModal
          isOpen={newInteractionModalOpen}
          onClose={() => setNewInteractionModalOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;

