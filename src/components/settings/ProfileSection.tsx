import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Upload, Trash2, Edit3 } from 'lucide-react';

export const ProfileSection: React.FC = () => {
  const { userProfile, updateUserProfile, t } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      updateUserProfile({ photoURL: result });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateUserProfile({ photoURL: null });
  };

  return (
    <div className="glass-panel p-5 sm:p-6 space-y-5 rounded-2xl shadow-xl border border-white/50 dark:border-white/10">
      <div className="flex items-center gap-2 text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-200/50 dark:border-gray-800">
        <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span>{t.settings.profile.title}</span>
      </div>

      {/* Profile Photo Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative shrink-0">
          {userProfile.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.username}
              className="w-20 h-20 rounded-full object-cover border-4 border-white/80 dark:border-gray-800 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl shadow-md border-4 border-white/80 dark:border-gray-800">
              {userProfile.username ? userProfile.username.charAt(0).toUpperCase() : 'D'}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm active:scale-95 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>{t.settings.profile.upload}</span>
          </button>

          {userProfile.photoURL && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs sm:text-sm active:scale-95 transition-all border border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.settings.profile.remove}</span>
            </button>
          )}
        </div>
      </div>

      {/* Header Titles Editing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            {t.settings.profile.mainTitleLabel}
          </label>
          <input
            type="text"
            value={userProfile.mainTitle}
            onChange={(e) => updateUserProfile({ mainTitle: e.target.value })}
            placeholder="DailyHishab"
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            {t.settings.profile.subtitleLabel}
          </label>
          <input
            type="text"
            value={userProfile.subtitle}
            onChange={(e) => updateUserProfile({ subtitle: e.target.value })}
            placeholder="Personal & Business Ledger"
            className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
