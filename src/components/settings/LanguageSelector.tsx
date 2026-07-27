import React from 'react';
import { useApp } from '../../context/AppContext';
import { Globe } from 'lucide-react';
import { Language } from '../../types/user.types';

export const LanguageSelector: React.FC = () => {
  const { userProfile, updateUserProfile, t } = useApp();

  const languages: { id: Language; label: string; sub: string; flag: string }[] = [
    { id: 'en', label: 'English', sub: 'English Language', flag: '🇬🇧' },
    { id: 'bn', label: 'বাংলা', sub: 'বাংলা ভাষা', flag: '🇧🇩' },
  ];

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200/50 dark:border-gray-800">
        <Globe className="w-5 h-5 text-emerald-500" />
        <span>{t.settings.language.title}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {languages.map((item) => {
          const isActive = userProfile.language === item.id;
          return (
            <button
              key={item.id}
              onClick={() => updateUserProfile({ language: item.id })}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl text-left transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-500/50'
                  : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-2xl">{item.flag}</span>
              <div className="min-w-0">
                <span className="block text-sm font-bold truncate">{item.label}</span>
                <span className={`block text-[11px] font-medium opacity-80 truncate ${isActive ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.sub}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
