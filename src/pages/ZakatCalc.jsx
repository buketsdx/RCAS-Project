import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, endOfMonth } from 'date-fns';
import { FileSpreadsheet, Printer, Calculator, Scale, FileCheck } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ZakatCalc() {
  const [asOnDate, setAsOnDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [adjustments, setAdjustments] = useState([]);
  const [newAdj, setNewAdj] = useState({ description: '', amount: '', type: 'Addition' });

  const { data: ledgers = [], isLoading: ledgersLoading } = useQuery({ queryKey: ['ledgers'], queryFn: () => base44.entities.Ledger.list() });
  const { data: groups = [] } = useQuery({ queryKey: ['accountGroups'], queryFn: () => base44.entities.AccountGroup.list() });
  const { data: entries = [], isLoading: entriesLoading } = useQuery({ queryKey: ['ledgerEntries'], queryFn: () => base44.entities.VoucherLedgerEntry.list() });
  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery({ queryKey: ['vouchers'], queryFn: () => base44.entities.Voucher.list() });
  const { data: company } = useQuery({ queryKey: ['companies'], queryFn: () => base44.entities.Company.list(), select: (data) => data[0] });

  const isLoading = ledgersLoading || entriesLoading || vouchersLoading;

  const calculateLedgerBalance = (ledgerId) => {
    const ledger = ledgers.find(l => l.id === ledgerId);
    let balance = parseFloat(ledger?.opening_balance || 0);
    const openingType = ledger?.opening_balance_type || 'Dr';
    if (openingType === 'Cr') balance = -balance;

    entries.filter(e => {
      if (e.ledger_id !== ledgerId) return false;
      const voucher = vouchers.find(v => v.id === e.voucher_id);
      return voucher && voucher.date <= asOnDate;
    }).forEach(e => {
      balance += (parseFloat(e.debit_amount) || 0) - (parseFloat(e.credit_amount) || 0);
    });

    return balance;
  };

  const getGroupData = (nature) => {
    const natureGroups = groups.filter(g => g.nature === nature);
    let total = 0;
    
    natureGroups.forEach(group => {
      const groupLedgers = ledgers.filter(l => l.group_id === group.id);
      groupLedgers.forEach(ledger => {
        const balance = calculateLedgerBalance(ledger.id);
        // Adjust sign based on nature
        if (nature === 'Assets' || nature === 'Expenses') total += balance;
        else total -= balance; // Liabilities, Income, Capital are Credit nature usually
      });
    });
    return total;
  };

  const addAdjustment = () => {
    if (!newAdj.description || !newAdj.amount) return;
    setAdjustments([...adjustments, { ...newAdj, id: Date.now(), amount: parseFloat(newAdj.amount) }]);
    setNewAdj({ description: '', amount: '', type: 'Addition' });
  };

  const removeAdjustment = (id) => {
    setAdjustments(adjustments.filter(a => a.id !== id));
  };

  // Simplified Zakat Base Calculation
  const assets = getGroupData('Assets');
  const liabilities = getGroupData('Liabilities');
  const equity = getGroupData('Capital'); // Should include Retained Earnings
  
  const totalAdditions = adjustments.filter(a => a.type === 'Addition').reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = adjustments.filter(a => a.type === 'Deduction').reduce((sum, a) => sum + a.amount, 0);

  // Net Worth for Zakat
  // Formula: Zakat Base = Equity + Long Term Liabilities + Net Profit - Fixed Assets (Simplified)
  // For now, using Net Assets (Assets - Liabilities) + Adjustments
  const netWorth = (assets - liabilities) + totalAdditions - totalDeductions;
  const zakatAmount = Math.max(0, netWorth * 0.025);

  if (isLoading) return <LoadingSpinner text="Calculating Zakat Base..." />;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Zakat Declaration" 
        subtitle="Calculate and generate Zakat Declaration Form (ZDF)"
        actions={<Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print Declaration</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Zakat Base Calculation</CardTitle>
            <CardDescription>Based on financial position as of {asOnDate}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <span className="font-medium">Total Assets</span>
                <span>{formatCurrency(assets)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <span className="font-medium">Total Liabilities</span>
                <span>{formatCurrency(liabilities)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded text-blue-700">
                <span className="font-bold">Net Equity (Calculated)</span>
                <span className="font-bold">{formatCurrency(assets - liabilities)}</span>
              </div>
              
              <div className="pt-4 border-t">
                <label className="text-sm font-medium mb-1 block">Zakat Adjustments</label>
                <div className="flex gap-2 mb-2">
                  <select 
                    className="border rounded p-2"
                    value={newAdj.type}
                    onChange={e => setNewAdj({...newAdj, type: e.target.value})}
                  >
                    <option value="Addition">Addition (+)</option>
                    <option value="Deduction">Deduction (-)</option>
                  </select>
                  <input 
                    type="text" 
                    value={newAdj.description} 
                    onChange={e => setNewAdj({...newAdj, description: e.target.value})} 
                    className="flex-1 border rounded p-2" 
                    placeholder="Description (e.g. Provisions, Exempt Assets)"
                  />
                  <input 
                    type="number" 
                    value={newAdj.amount} 
                    onChange={e => setNewAdj({...newAdj, amount: e.target.value})} 
                    className="w-24 border rounded p-2" 
                    placeholder="Amount"
                  />
                  <Button onClick={addAdjustment} size="sm">Add</Button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {adjustments.map(adj => (
                    <div key={adj.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                      <span className={adj.type === 'Addition' ? 'text-green-600' : 'text-red-600'}>
                        {adj.type === 'Addition' ? '+' : '-'} {adj.description}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{formatCurrency(adj.amount)}</span>
                        <button onClick={() => removeAdjustment(adj.id)} className="text-gray-400 hover:text-red-500">×</button>
                      </div>
                    </div>
                  ))}
                  {adjustments.length === 0 && <p className="text-xs text-slate-500 italic">No adjustments added.</p>}
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-lg mt-4">
                <div>
                  <p className="text-sm opacity-80">Zakat Base</p>
                  <p className="text-xl font-bold">{formatCurrency(netWorth)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Zakat Due (2.5%)</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(zakatAmount)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField 
                label="Assessment Date" 
                type="date" 
                value={asOnDate} 
                onChange={e => setAsOnDate(e.target.value)} 
              />
              <div className="mt-4">
                <Alert>
                  <Scale className="h-4 w-4" />
                  <AlertTitle>ZATCA Rule</AlertTitle>
                  <AlertDescription>
                    Zakat is calculated at 2.5% of the Zakat Base for the lunar year (Hijri). For Gregorian year, the rate is adjusted to approximately 2.577%.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Info</CardTitle>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="space-y-2 text-sm">
                  <p><span className="text-slate-500">Name:</span> {company.name}</p>
                  <p><span className="text-slate-500">TIN:</span> {company.vat_number}</p>
                  <p><span className="text-slate-500">CR:</span> {company.cr_number}</p>
                </div>
              ) : <p className="text-sm text-slate-500">No company profile found.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
