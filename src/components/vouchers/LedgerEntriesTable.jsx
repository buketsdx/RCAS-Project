import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';

export default function LedgerEntriesTable({
  entries = [],
  ledgers = [],
  onEntryChange,
  onAddEntry,
  onRemoveEntry
}) {
  const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);

  const handleEntryChange = (index, field, value) => {
    const updatedEntry = { ...entries[index], [field]: value };
    
    if (field === 'ledger_id') {
      const ledger = ledgers.find(l => l.id === value);
      if (ledger) {
        updatedEntry.ledger_name = ledger.name;
      }
    }
    
    onEntryChange(index, updatedEntry);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ledger Account</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Debit (SAR)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Credit (SAR)</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Select 
                    value={entry.ledger_id || ''} 
                    onValueChange={(v) => handleEntryChange(index, 'ledger_id', v)}
                  >
                    <SelectTrigger className="min-w-[200px] bg-white">
                      <SelectValue placeholder="Select ledger" />
                    </SelectTrigger>
                    <SelectContent>
                      {ledgers.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={entry.debit_amount || ''}
                    onChange={(e) => handleEntryChange(index, 'debit_amount', e.target.value)}
                    className="w-32 text-right bg-white"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={entry.credit_amount || ''}
                    onChange={(e) => handleEntryChange(index, 'credit_amount', e.target.value)}
                    className="w-32 text-right bg-white"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveEntry(index)}
                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="px-4 py-3 font-semibold text-slate-700">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-700">{totalDebit.toFixed(2)}</td>
              <td className="px-4 py-3 text-right font-semibold text-slate-700">{totalCredit.toFixed(2)}</td>
              <td></td>
            </tr>
            {difference > 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-2 text-center text-red-500 text-sm">
                  Difference: {difference.toFixed(2)} SAR - Voucher is not balanced
                </td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={onAddEntry}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>
    </div>
  );
}