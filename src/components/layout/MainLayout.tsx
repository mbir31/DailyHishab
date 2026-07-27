import React from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { WelcomeScreen } from '../auth/WelcomeScreen';
import { EntryPlusPage } from '../../pages/EntryPlusPage';
import { EntryMinusPage } from '../../pages/EntryMinusPage';
import { AccountsPage } from '../../pages/AccountsPage';
import { SettingsPage } from '../../pages/SettingsPage';

export const MainLayout: React.FC = () => {
  const { userProfile, activeTab } = useApp();

  // If user is not logged in or hasn't finished setup, render WelcomeScreen
  if (!userProfile.isLoggedIn || !userProfile.isFirstSetupCompleted) {
    return <WelcomeScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121316] text-[#1A1A1A] dark:text-[#F8F9FA] transition-colors duration-300">
      {/* Fixed Glassmorphic Header */}
      <Header />

      {/* Main Content View with top margin for fixed header */}
      <main className="pt-24 sm:pt-28 px-3 sm:px-6 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
        {activeTab === 'income' && <EntryPlusPage />}
        {activeTab === 'expense' && <EntryMinusPage />}
        {activeTab === 'accounts' && <AccountsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      {/* Fixed iOS Glassmorphic Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
