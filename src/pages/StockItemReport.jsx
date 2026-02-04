import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '../context/CompanyContext';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Package } from 'lucide-react';

export default function StockItemReport() {
  const { type, selectedCompanyId } = useCompany();
  const [selectedItem, setSelectedItem] = useState('');

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Product Report',
          subtitle: 'Product movement analysis',
          item: 'Product',
          stock: 'Stock'
        };
      case 'Restaurant':
        return {
          title: 'Item Report',
          subtitle: 'Item movement analysis',
          item: 'Item',
          stock: 'Stock'
        };
      default:
        return {
          title: 'Stock Item Report',
          subtitle: 'Item-wise movement analysis',
          item: 'Stock Item',
          stock: 'Stock'
        };
    }
  };

  const terms = getTerminology();
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: items = [] } = useQuery({ 
    queryKey: ['stockItems', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.StockItem.list();
      return list.filter(i => String(i.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  
  const { data: voucherItems = [], isLoading } = useQuery({ 
    queryKey: ['voucherItems', selectedCompanyId], 
    queryFn: async () => {
      const allItems = await rcas.entities.VoucherItem.list();
      // Filter items based on vouchers belonging to the selected company
      const companyVouchers = (await rcas.entities.Voucher.list())
        .filter(v => String(v.company_id) === String(selectedCompanyId));
      const voucherIds = new Set(companyVouchers.map(v => v.id));
      return allItems.filter(item => voucherIds.has(item.voucher_id));
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

  const { data: units = [] } = useQuery({ 
    queryKey: ['units', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Unit.list();
      return list.filter(u => String(u.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const stockItem = items.find(i => i.id === selectedItem);
  const unit = units.find(u => u.id === stockItem?.unit_id);

  const itemTransactions = voucherItems
    .filter(vi => vi.stock_item_id === selectedItem)
    .map(vi => {
      const voucher = vouchers.find(v => v.id === vi.voucher_id);
      return { ...vi, voucher };
    })
    .filter(vi => {
      if (!vi.voucher) return false;
      return vi.voucher.date >= filters.fromDate && vi.voucher.date <= filters.toDate;
    })
    .sort((a, b) => new Date(a.voucher?.date) - new Date(b.voucher?.date));

  let runningQty = parseFloat(stockItem?.opening_qty || 0);
  const transactionsWithBalance = itemTransactions.map(t => {
    const qty = parseFloat(t.quantity) || 0;
    const isInward = ['Purchase', 'Credit Note', 'Receipt Note', 'Stock Increase'].includes(t.voucher?.voucher_type);
    if (isInward) runningQty += qty;
    else runningQty -= qty;
    return { ...t, inward: isInward ? qty : 0, outward: !isInward ? qty : 0, balance: runningQty };
  });

  const totalInward = transactionsWithBalance.reduce((sum, t) => sum + t.inward, 0);
  const totalOutward = transactionsWithBalance.reduce((sum, t) => sum + t.outward, 0);

  const columns = [
    { header: 'Date', render: (row) => row.voucher?.date ? format(new Date(row.voucher.date), 'dd MMM yyyy') : '-' },
    { header: 'Voucher', render: (row) => `${row.voucher?.voucher_type} - ${row.voucher?.voucher_number || '#' + row.voucher?.id?.slice(-6)}` },
    { header: 'Party', render: (row) => row.voucher?.party_name || '-' },
    { header: 'Inward', className: 'text-right', render: (row) => row.inward > 0 ? <span className="text-emerald-600">+{row.inward.toFixed(2)}</span> : '-' },
    { header: 'Outward', className: 'text-right', render: (row) => row.outward > 0 ? <span className="text-red-600">-{row.outward.toFixed(2)}</span> : '-' },
    { header: 'Balance', className: 'text-right', render: (row) => <span className="font-semibold">{row.balance.toFixed(2)}</span> }
  ];

  return (
    <div>
      <PageHeader title={terms.title} subtitle={terms.subtitle} />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label={`Select ${terms.item}`} name="item" type="select" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)} options={[{ value: '', label: `Select ${terms.item}` }, ...items.map(i => ({ value: i.id, label: i.name }))]} />
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {selectedItem && stockItem && (
        <>
          <Card className="mb-6">
            <CardHeader><CardTitle>{stockItem.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Opening {terms.stock}</p>
                  <p className="text-xl font-bold">{parseFloat(stockItem.opening_qty || 0).toFixed(2)} {unit?.name}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Inward</p>
                  <p className="text-xl font-bold text-emerald-600">+{totalInward.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-slate-500">Total Outward</p>
                  <p className="text-xl font-bold text-red-600">-{totalOutward.toFixed(2)}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-slate-500">Closing {terms.stock}</p>
                  <p className="text-xl font-bold text-blue-600">{runningQty.toFixed(2)} {unit?.name}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-slate-500">Value</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(runningQty * parseFloat(stockItem.cost_price || 0), 'SAR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? <LoadingSpinner /> : <DataTable columns={columns} data={transactionsWithBalance} pagination={false} />}
        </>
      )}

      {!selectedItem && (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Select a stock item to view its movement report</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}