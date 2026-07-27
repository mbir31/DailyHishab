import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Laptop, Palette } from 'lucide-react';
import { ThemeMode } from '../../types/user.types';

export const ThemeSelector: React.FC = () => {
  const { userProfile, updateUserProfile, t } = useApp();

  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: t.settings.appearance.light, icon: <Sun className="w-4 h-4 text-amber-500" /> },
    { id: 'dark', label: t.settings.appearance.dark, icon: <Moon className="w-4 h-4 text-indigo-400" /> },
    { id: 'system', label: t.settings.appearance.system, icon: <Laptop className="w-4 h-4 text-slate-500" /> },
  ];

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200/50 dark:border-gray-800">
        <Palette className="w-5 h-5 text-amber-500" />
        <span>{t.settings.appearance.title}</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {themes.map((item) => {
          const isActive = userProfile.theme === item.id;
          return (
            <button
              key={item.id}
              onClick={() => updateUserProfile({ theme: item.id })}
              className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/50'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="mb-1.5">{item.icon}</div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
