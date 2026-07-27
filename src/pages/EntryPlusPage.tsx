import React from 'react';
import { DateSelector } from '../components/shared/DateSelector';
import { EntryTable } from '../components/entries/EntryTable';

export const EntryPlusPage: React.FC = () => {
  return (
    <div className="space-y-4 pb-24">
      {/* Shared Date Selector */}
      <DateSelector />

      {/* Income Records Entry Table */}
      <EntryTable type="income" />
    </div>
  );
};
