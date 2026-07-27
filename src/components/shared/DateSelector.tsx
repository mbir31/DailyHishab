import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatDateDisplay } from '../../utils/dateHelpers';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { CalendarModal } from './CalendarModal';

export const DateSelector: React.FC = () => {
  const { selectedDate, shiftSelectedDate, userProfile } = useApp();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const { weekday, dateFormatted } = formatDateDisplay(selectedDate, userProfile.language);

  return (
    <>
      <div className="w-full max-w-lg mx-auto mb-5 glass-card p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-md rounded-2xl">
        {/* Previous Day Button */}
        <button
          onClick={() => shiftSelectedDate(-1)}
          className="p-2.5 sm:p-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-all active:scale-95 shrink-0"
          title="Previous Day (-1)"
          aria-label="Previous Day"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Center Date Display (Tap to open calendar modal) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
        >
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
          <div className="text-center min-w-0">
            <span className="block text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider leading-none mb-0.5">
              {weekday}
            </span>
            <span className="block text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate leading-tight">
              {dateFormatted}
            </span>
          </div>
        </button>

        {/* Next Day Button */}
        <button
          onClick={() => shiftSelectedDate(1)}
          className="p-2.5 sm:p-3 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 text-gray-700 dark:text-gray-200 hover:text-blue-600 transition-all active:scale-95 shrink-0"
          title="Next Day (+1)"
          aria-label="Next Day"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <CalendarModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
