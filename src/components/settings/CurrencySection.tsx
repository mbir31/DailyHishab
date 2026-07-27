import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DollarSign, Check, Coins } from 'lucide-react';

const CURRENCY_PRESETS = [
  { symbol: '৳', code: 'BDT', name: 'Bangladeshi Taka' },
  { symbol: '$', code: 'USD', name: 'US Dollar' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  { symbol: '€', code: 'EUR', name: 'Euro' },
  { symbol: '£', code: 'GBP', name: 'British Pound' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham' },
  { symbol: 'SR', code: 'SAR', name: 'Saudi Riyal' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar' },
];

export const CurrencySection: React.FC = () => {
  const { userProfile, updateUserProfile, t } = useApp();
  const currentSymbol = userProfile.currency || (userProfile.language === 'bn' ? '৳' : '₹');

  const [isCustom, setIsCustom] = useState<boolean>(
    !CURRENCY_PRESETS.some((p) => p.symbol === currentSymbol)
  );
  const [customSymbol, setCustomSymbol] = useState<string>(currentSymbol);

  const handleSelectPreset = (symbol: string) => {
    setIsCustom(false);
    updateUserProfile({ currency: symbol });
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomSymbol(val);
    updateUserProfile({ currency: val });
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-4 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      {/* Section Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-gray-200/50 dark:border-gray-800">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {t.settings.currency.title}
          </h2>
          <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
            {t.settings.currency.subtitle}
          </p>
        </div>
      </div>

      {/* Preset Currency Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {CURRENCY_PRESETS.map((item) => {
          const isSelected = !isCustom && currentSymbol === item.symbol;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelectPreset(item.symbol)}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all active:scale-95 text-left cursor-pointer ${
                isSelected
                  ? 'bg-blue-600/10 border-blue-500 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/30 font-bold'
                  : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 hover:bg-black/10'
              }`}
            >
              <div>
                <span className="block text-base font-black">{item.symbol}</span>
                <span className="block text-[10px] opacity-70 font-medium">{item.code}</span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
            </button>
          );
        })}
      </div>

      {/* Custom Currency Symbol Input */}
      <div className="pt-2 border-t border-gray-200/50 dark:border-gray-800 space-y-2">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          {t.settings.currency.customLabel}
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={customSymbol}
            onChange={handleCustomChange}
            placeholder={t.settings.currency.customPlaceholder}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="px-4 py-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-black select-none">
            Preview: {customSymbol || '৳'} 1,250.00
          </div>
        </div>
      </div>
    </div>
  );
};
