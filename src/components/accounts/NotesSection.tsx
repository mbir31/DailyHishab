import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { getNoteForRange, saveNoteForRange } from '../../utils/storage';
import { FileText, Check } from 'lucide-react';

interface NotesSectionProps {
  fromDate: string;
  toDate: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ fromDate, toDate }) => {
  const { t } = useApp();

  const [noteContent, setNoteContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const existing = getNoteForRange(fromDate, toDate);
    setNoteContent(existing);
  }, [fromDate, toDate]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNoteContent(val);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveNoteForRange(fromDate, toDate, val);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 600);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 space-y-3 rounded-2xl shadow-lg border border-white/50 dark:border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-900 dark:text-white">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t.accounts.notes.title}</span>
        </div>
        {isSaved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span>{t.accounts.notes.saved}</span>
          </span>
        )}
      </div>

      <textarea
        value={noteContent}
        onChange={handleChange}
        placeholder={t.accounts.notes.placeholder}
        rows={3}
        className="w-full p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none resize-y transition-all"
      />
    </div>
  );
};
