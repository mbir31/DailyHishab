import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getTodayDateString, shiftDateString, formatDateDisplay } from '../../utils/dateHelpers';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const { selectedDate, setSelectedDate, userProfile, t } = useApp();
  const [pickerDate, setPickerDate] = useState<string>(selectedDate);

  if (!isOpen) return null;

  const handleApply = (dateToSet: string) => {
    setSelectedDate(dateToSet);
    onClose();
  };

  const handleToday = () => {
    handleApply(getTodayDateString());
  };

  const handleYesterday = () => {
    handleApply(shiftDateString(getTodayDateString(), -1));
  };

  const { weekday, dateFormatted } = formatDateDisplay(pickerDate, userProfile.language);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel p-6 shadow-2xl rounded-3xl relative border border-white/40 dark:border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400 font-bold text-lg">
          <CalendarIcon className="w-5 h-5" />
          <span>{t.dateSelector.selectDate}</span>
        </div>

        {/* Selected preview display */}
        <div className="bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl p-4 text-center mb-5 border border-blue-500/20">
          <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {weekday}
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            {dateFormatted}
          </div>
        </div>

        {/* Quick buttons */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <button
            onClick={handleToday}
            className="py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium text-sm shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            {t.dateSelector.today}
          </button>
          <button
            onClick={handleYesterday}
            className="py-2.5 px-4 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium text-sm hover:bg-gray-300 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            {t.dateSelector.yesterday}
          </button>
        </div>

        {/* Custom HTML5 Date Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Pick Custom Date
          </label>
          <input
            type="date"
            value={pickerDate}
            onChange={(e) => setPickerDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleApply(pickerDate)}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            {t.common.confirm}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-2xl active:scale-95 transition-all"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
