import React from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import { PlusCircle, MinusCircle, PieChart, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, userProfile, t } = useApp();

  const labels = userProfile.customLabels || {};
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'income',
      label: labels.entryPlus || t.nav.entryPlus,
      icon: <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
      color: 'text-emerald-500',
    },
    {
      id: 'expense',
      label: labels.entryMinus || t.nav.entryMinus,
      icon: <MinusCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
      color: 'text-rose-500',
    },
    {
      id: 'accounts',
      label: labels.accounts || t.nav.accounts,
      icon: <PieChart className="w-5 h-5 sm:w-6 sm:h-6" />,
      color: 'text-blue-500',
    },
    {
      id: 'settings',
      label: labels.settings || t.nav.settings,
      icon: <Settings className="w-5 h-5 sm:w-6 sm:h-6" />,
      color: 'text-slate-500',
    },
  ];

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg glass-nav rounded-full px-2 py-1.5 transition-all duration-300">
      <div className="flex items-center justify-between">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full transition-all duration-200 active:scale-95 min-h-[48px] ${
                isActive
                  ? 'bg-blue-600/10 dark:bg-white/15 text-blue-600 dark:text-blue-400 font-semibold shadow-inner'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <div className={`transition-transform duration-200 ${isActive ? 'scale-110 ' + item.color : ''}`}>
                {item.icon}
              </div>
              <span className="text-[11px] sm:text-xs mt-0.5 truncate tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
