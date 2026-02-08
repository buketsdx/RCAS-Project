import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrency } from '@/context/CurrencyContext';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Coins, Plus, Pencil, Trash2, RefreshCw, Globe } from 'lucide-react';

export default function Currencies() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { baseCurrency, baseCurrencySymbol, setSelectedCurrency, CURRENCY_SYMBOLS } = useCurrency();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    code: '', name: '', symbol: '', exchange_rate: 1, decimal_places: 2, is_base_currency: false
  });

  const { data: currencies = [], isLoading } = useQuery({ 
    queryKey: ['currencies', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Currency.list();
      return list.filter(c => String(c.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.Currency.create({ ...data, company_id: selectedCompanyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies', selectedCompanyId] }); toast.success('Currency added'); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Currency.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies', selectedCompanyId] }); toast.success('Currency updated'); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Currency.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['currencies', selectedCompanyId] }); toast.success('Currency deleted'); }
  });

  const openDialog = (currency = null) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({ ...currency });
    } else {
      setEditingCurrency(null);
      setFormData({ code: '', name: '', symbol: '', exchange_rate: 1, decimal_places: 2, is_base_currency: false });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingCurrency(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, exchange_rate: parseFloat(formData.exchange_rate) || 1, decimal_places: parseInt(formData.decimal_places) || 2 };
    if (editingCurrency) updateMutation.mutate({ id: editingCurrency.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'Code', accessor: 'code', render: (row) => <span className="font-mono font-bold">{row.code}</span> },
    { header: 'Name', accessor: 'name' },
    { header: 'Symbol', accessor: 'symbol', render: (row) => <span className="text-lg">{row.symbol}</span> },
    { header: 'Exchange Rate', accessor: 'exchange_rate', render: (row) => `1 ${row.code} = ${parseFloat(row.exchange_rate || 1).toFixed(4)} SAR` },
    { header: 'Type', render: (row) => row.is_base_currency ? <Badge className="bg-emerald-100 text-emerald-700">Base Currency</Badge> : <Badge variant="outline">Foreign</Badge> },
    { header: 'Status', render: (row) => <Badge className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{row.is_active !== false ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}><Pencil className="h-4 w-4" /></Button>
        {!row.is_base_currency && <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
      </div>
    )}
  ];

  if (isLoading) return <LoadingSpinner text="Loading currencies..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Currencies" subtitle="Multi-currency management" primaryAction={{ label: 'Add Currency', onClick: () => openDialog() }} />
      
      {/* Base Currency Display */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-green-600" />
            Base Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Current Base Currency</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{baseCurrency}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Symbol</p>
              <p className="text-5xl font-bold text-green-600 dark:text-green-400">{baseCurrency === 'SAR' ? 'SAR' : baseCurrencySymbol}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Quick Select</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(CURRENCY_SYMBOLS).slice(0, 5).map(([code, symbol]) => (
                  <Button
                    key={code}
                    variant={baseCurrency === code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCurrency(code, symbol)}
                    className={baseCurrency === code ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {code} {symbol}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currencies List */}
      <div>
        {currencies.length === 0 ? (
          <EmptyState icon={Coins} title="No Currencies" description="Add currencies for multi-currency transactions" action={{ label: 'Add Currency', onClick: () => openDialog() }} />
        ) : (
          <DataTable columns={columns} data={currencies} />
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCurrency ? 'Edit' : 'Add'} Currency</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Currency Code" name="code" value={formData.code} onChange={handleChange} required placeholder="e.g. USD" />
                <FormField label="Symbol" name="symbol" value={formData.symbol} onChange={handleChange} placeholder="e.g. $" />
              </div>
              <FormField label="Currency Name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. US Dollar" />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Exchange Rate (to SAR)" name="exchange_rate" type="number" value={formData.exchange_rate} onChange={handleChange} />
                <FormField label="Decimal Places" name="decimal_places" type="number" value={formData.decimal_places} onChange={handleChange} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_base_currency" name="is_base_currency" checked={formData.is_base_currency} onChange={handleChange} className="rounded" />
                <label htmlFor="is_base_currency" className="text-sm">This is the base currency</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editingCurrency ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
