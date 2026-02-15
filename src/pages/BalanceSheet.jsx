import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, endOfMonth } from 'date-fns';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';
import { Button } from "@/components/ui/button";

function ReportSection({ title, data, total, color }) {
  return (
    <Card>
      <CardHeader className={`bg-${color}-50`}>
        <CardTitle className={`text-${color}-700`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-2">
          {data.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No data</p>
          ) : (
            data.map((item, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-slate-100">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.group}</p>
                </div>
                <span className="font-medium">{item.amount.toFixed(2)}</span>
              </div>
            ))
          )}
          <div className={`flex justify-between py-3 bg-${color}-50 px-3 rounded-lg font-bold mt-4`}>
            <span>Total {title}</span>
            <span>{formatCurrency(total, 'SAR')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BalanceSheet() {
  const { selectedCompanyId } = useCompany();
  const [asOnDate, setAsOnDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const { data: ledgers = [], isLoading } = useQuery({ 
    queryKey: ['ledgers', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: groups = [] } = useQuery({ 
    queryKey: ['accountGroups', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.AccountGroup.list();
      return list.filter(g => String(g.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: entries = [] } = useQuery({ 
    queryKey: ['ledgerEntries', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.VoucherLedgerEntry.list();
      // Filter entries based on vouchers belonging to the selected company
      const allVouchers = await rcas.entities.Voucher.list();
      const companyVoucherIds = new Set(
        allVouchers
          .filter(v => String(v.company_id) === String(selectedCompanyId))
          .map(v => v.id)
      );
      return list.filter(e => companyVoucherIds.has(e.voucher_id));
    },
    enabled: !!selectedCompanyId
  });

  const { data: vouchers = [] } = useQuery({ 
    queryKey: ['vouchers', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

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
    const data = [];
    
    natureGroups.forEach(group => {
      const groupLedgers = ledgers.filter(l => l.group_id === group.id);
      groupLedgers.forEach(ledger => {
        const balance = calculateLedgerBalance(ledger.id);
        if (balance !== 0) {
          data.push({
            name: ledger.name,
            group: group.name,
            amount: nature === 'Assets' ? balance : -balance
          });
        }
      });
    });

    return data.filter(d => d.amount > 0);
  };

  const assetsData = getGroupData('Assets');
  const liabilitiesData = getGroupData('Liabilities');
  const capitalData = getGroupData('Capital');

  const totalAssets = assetsData.reduce((sum, item) => sum + item.amount, 0);
  const totalLiabilities = liabilitiesData.reduce((sum, item) => sum + item.amount, 0);
  const totalCapital = capitalData.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) return <LoadingSpinner text="Generating balance sheet..." />;

  return (
    <div>
      <PageHeader 
        title="Balance Sheet" 
        subtitle={`As on ${format(new Date(asOnDate), 'dd MMMM yyyy')}`}
        secondaryActions={<Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>}
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <FormField label="As On Date" name="asOnDate" type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} className="max-w-xs" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ReportSection title="Assets" data={assetsData} total={totalAssets} color="blue" />
        </div>
        <div className="space-y-6">
          <ReportSection title="Liabilities" data={liabilitiesData} total={totalLiabilities} color="orange" />
          <ReportSection title="Capital" data={capitalData} total={totalCapital} color="purple" />
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="py-6">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-slate-600">Total Assets</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAssets, 'SAR')}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-slate-600">Total Liabilities + Capital</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalLiabilities + totalCapital, 'SAR')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
