import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import DashboardPage from './components/dashboard/DashboardPage';
import CustomersPage from './components/customers/CustomersPage';
import SegmentPage from './components/segments/SegmentPage';
import CampaignsPage from './components/campaigns/CampaignsPage';
import AnalyticsPage from './components/analytics/AnalyticsPage';
import { ToastProvider } from './components/ui/Toast';
import AIChatModal from './components/ui/AIChatModal';

function App() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="relative min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-96 page-background" />
        <div className="flex min-h-screen">
          <Sidebar onOpenAssistant={() => setAssistantOpen(true)} />
          <main className="flex-1 p-6 xl:p-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="min-h-full rounded-[28px] bg-[rgba(255,255,255,0.92)] p-6 shadow-[0_40px_80px_rgba(15,23,42,0.08)] ring-1 ring-white/20 backdrop-blur-xl"
            >
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/segments" element={<SegmentPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </main>
        </div>
        <AIChatModal open={assistantOpen} onClose={() => setAssistantOpen(false)} />
      </div>
    </ToastProvider>
  );
}

export default App;
