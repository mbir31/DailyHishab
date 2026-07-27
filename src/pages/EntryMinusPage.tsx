import React from 'react';
import { DateSelector } from '../components/shared/DateSelector';
import { EntryTable } from '../components/entries/EntryTable';

export const EntryMinusPage: React.FC = () => {
  return (
    <div className="space-y-4 pb-24">
      {/* Shared Date Selector */}
      <DateSelector />

      {/* Expense Records Entry Table */}
      <EntryTable type="expense" />
    </div>
  );
};
