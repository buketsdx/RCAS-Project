import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl, formatCurrency } from "@/utils";
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import VoucherItemsTable from '@/components/vouchers/VoucherItemsTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save, Plus, X } from 'lucide-react';

export default function PurchaseInvoice() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');

  const [formData, setFormData] = useState({
    voucher_type: 'Purchase',
    voucher_number: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    party_ledger_id: '',
    party_name: '',
    reference_number: '',
    billing_address: '',
    narration: '',
    status: 'Confirmed'
  });

  const [supplierType, setSupplierType] = useState('General');
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    customer_type: 'General',
    vat_number: '',
    contact_person: '',
    address: '',
    city: '',
    phone: '',
    email: ''
  });

  const [items, setItems] = useState([{ stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }]);

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Ledger.list();
      return all.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.StockItem.list();
      return all.filter(i => String(i.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: existingVoucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId, selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.find(v => v.id === voucherId && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!voucherId && !!selectedCompanyId
  });

  const { data: existingItems = [] } = useQuery({
    queryKey: ['voucherItems', voucherId],
    queryFn: async () => {
      const allItems = await rcas.entities.VoucherItem.list();
      return allItems.filter(item => item.voucher_id === voucherId);
    },
    enabled: !!voucherId && !!existingVoucher
  });

  useEffect(() => {
    if (existingVoucher) {
      setFormData({
        voucher_type: 'Purchase',
        voucher_number: existingVoucher.voucher_number || '',
        date: existingVoucher.date || format(new Date(), 'yyyy-MM-dd'),
        party_ledger_id: existingVoucher.party_ledger_id || '',
        party_name: existingVoucher.party_name || '',
        reference_number: existingVoucher.reference_number || '',
        billing_address: existingVoucher.billing_address || '',
        narration: existingVoucher.narration || '',
        status: existingVoucher.status || 'Confirmed'
      });
    }
  }, [existingVoucher]);

  useEffect(() => {
    if (existingItems.length > 0) {
      setItems(existingItems.map(item => ({
        id: item.id, stock_item_id: item.stock_item_id, stock_item_name: item.stock_item_name,
        quantity: item.quantity, rate: item.rate, discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0, vat_rate: item.vat_rate || 15,
        vat_amount: item.vat_amount || 0, amount: item.amount, total_amount: item.total_amount
      })));
    }
  }, [existingItems]);

  const partyLedgers = ledgers.filter(l => {
    return l.customer_type === supplierType;
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (supplierData) => {
      const ledgerData = {
        name: supplierData.name,
        group_id: 'Sundry Creditors',
        customer_type: supplierData.customer_type,
        vat_number: supplierData.vat_number || '',
        contact_person: supplierData.contact_person || '',
        address: supplierData.address || '',
        city: supplierData.city || '',
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        is_active: true,
        company_id: selectedCompanyId
      };
      return rcas.entities.Ledger.create(ledgerData);
    },
    onSuccess: (newLedger) => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success('Supplier created successfully');
      setFormData(prev => ({
        ...prev,
        party_ledger_id: newLedger.id,
        party_name: newLedger.name,
        billing_address: newLedger.address || ''
      }));
      setShowNewSupplierDialog(false);
      setNewSupplier({
        name: '',
        customer_type: 'General',
        vat_number: '',
        contact_person: '',
        address: '',
        city: '',
        phone: '',
        email: ''
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      try {
        const grossAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0);
        const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);

        const voucherData = { 
          ...formData, 
          gross_amount: grossAmount, 
          vat_amount: vatAmount, 
          net_amount: netAmount,
          company_id: selectedCompanyId 
        };

        let voucher;
        if (voucherId) {
          voucher = await rcas.entities.Voucher.update(voucherId, voucherData);
          for (const item of existingItems) {
            try {
              await rcas.entities.VoucherItem.delete(item.id);
            } catch (error) {
              console.warn('Failed to delete item:', error);
            }
          }
        } else {
          voucher = await rcas.entities.Voucher.create(voucherData);
        }

        for (const item of items) {
          if (item.stock_item_id) {
            try {
              await rcas.entities.VoucherItem.create({
                voucher_id: voucher.id, stock_item_id: item.stock_item_id, stock_item_name: item.stock_item_name,
                quantity: parseFloat(item.quantity) || 0, rate: parseFloat(item.rate) || 0,
                discount_percent: parseFloat(item.discount_percent) || 0, discount_amount: parseFloat(item.discount_amount) || 0,
                vat_rate: parseFloat(item.vat_rate) || 15, vat_amount: parseFloat(item.vat_amount) || 0,
                amount: parseFloat(item.amount) || 0, total_amount: parseFloat(item.total_amount) || 0
              });
            } catch (error) {
              console.warn('Failed to create item:', error);
            }
          }
        }
        return voucher;
      } catch (error) {
        throw new Error(error.message || 'Failed to save invoice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers', selectedCompanyId] });
      toast.success('Invoice saved successfully');
      setTimeout(() => {
        window.location.href = createPageUrl('Purchase');
      }, 1000);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save invoice. Please try again.');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'party_ledger_id') {
        const ledger = ledgers.find(l => l.id === value);
        if (ledger) { updated.party_name = ledger.name; updated.billing_address = ledger.address || ''; }
      }
      return updated;
    });
  };

  const totals = {
    gross: items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
    vat: items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0),
    net: items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0)
  };

  if (isLoading && voucherId) return <LoadingSpinner text="Loading..." />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader title={voucherId ? 'Edit Purchase Invoice' : 'New Purchase Invoice'} subtitle="Create or edit purchase invoice" backUrl="Purchase" />
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <Card>
              <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <FormField label="Invoice Number" name="voucher_number" value={formData.voucher_number} onChange={handleChange} placeholder="Auto" />
                  <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                  <FormField label="Supplier Inv No" name="reference_number" value={formData.reference_number} onChange={handleChange} />
                  <FormField label="Status" name="status" type="select" value={formData.status} onChange={handleChange} options={[{ value: 'Draft', label: 'Draft' }, { value: 'Confirmed', label: 'Confirmed' }]} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Supplier Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <FormField
                    label="Supplier Type"
                    name="supplierType"
                    type="select"
                    value={supplierType}
                    onChange={(e) => {
                      setSupplierType(e.target.value);
                      setNewSupplier(prev => ({ ...prev, customer_type: e.target.value }));
                      setFormData(prev => ({ ...prev, party_ledger_id: '', party_name: '' }));
                    }}
                    options={[
                      { value: 'VAT Customer', label: 'VAT Supplier' },
                      { value: 'General', label: 'General (Non-VAT Supplier)' }
                    ]}
                  />
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField label="Select Supplier" name="party_ledger_id" type="select" value={formData.party_ledger_id} onChange={handleChange} options={partyLedgers.map(l => ({ value: l.id, label: l.name }))} />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" className="w-full" onClick={() => setShowNewSupplierDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Supplier
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField label="Supplier Name" name="party_name" value={formData.party_name} onChange={handleChange} />
              </div>

              <FormField label="Address" name="billing_address" type="textarea" value={formData.billing_address} onChange={handleChange} rows={2} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoice Items</CardTitle></CardHeader>
            <CardContent>
              <VoucherItemsTable items={items} stockItems={stockItems} onItemChange={(i, item) => setItems(prev => prev.map((it, idx) => idx === i ? item : it))} onAddItem={() => setItems(prev => [...prev, { stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }])} onRemoveItem={(i) => setItems(prev => prev.filter((_, idx) => idx !== i))} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between w-64"><span className="text-slate-600 dark:text-muted-foreground">Subtotal:</span><span className="font-medium">{formatCurrency(totals.gross, 'SAR')}</span></div>
                <div className="flex justify-between w-64"><span className="text-slate-600 dark:text-muted-foreground">VAT:</span><span className="font-medium">{formatCurrency(totals.vat, 'SAR')}</span></div>
                <div className="flex justify-between w-64 pt-2 border-t dark:border-border"><span className="text-lg font-semibold">Total:</span><span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totals.net, 'SAR')}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Narration */}
          <Card>
            <CardContent className="pt-6">
              <FormField label="Narration / Notes" name="narration" type="textarea" value={formData.narration} onChange={handleChange} rows={2} />
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Sticky Action Buttons at Bottom */}
        <div className="sticky bottom-0 bg-white dark:bg-card border-t border-slate-200 dark:border-border shadow-lg px-4 md:px-8 py-4 z-10">
          <div className="max-w-6xl mx-auto flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.location.href = createPageUrl('Purchase')}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </div>
      </form>

      {/* New Supplier Dialog */}
      {showNewSupplierDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Create New Supplier</CardTitle>
              <button
                onClick={() => setShowNewSupplierDialog(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  label="Supplier Type"
                  name="customer_type"
                  type="select"
                  value={newSupplier.customer_type}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, customer_type: e.target.value }))}
                  options={[
                    { value: 'VAT Customer', label: 'VAT Supplier' },
                    { value: 'General', label: 'General (Non-VAT Supplier)' }
                  ]}
                />
                <FormField
                  label="Supplier Name *"
                  name="name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter supplier name"
                />
                {newSupplier.customer_type === 'VAT Customer' && (
                  <FormField
                    label="VAT Number"
                    name="vat_number"
                    value={newSupplier.vat_number}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, vat_number: e.target.value }))}
                    placeholder="VAT registration number"
                  />
                )}
                <FormField
                  label="Contact Person"
                  name="contact_person"
                  value={newSupplier.contact_person}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Contact person name"
                />
                <FormField
                  label="Address"
                  name="address"
                  type="textarea"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Supplier address"
                  rows={2}
                />
                <FormField
                  label="City"
                  name="city"
                  value={newSupplier.city}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
                <FormField
                  label="Phone"
                  name="phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
                <FormField
                  label="Email"
                  name="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewSupplierDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => createSupplierMutation.mutate(newSupplier)}
                    disabled={!newSupplier.name || createSupplierMutation.isPending}
                  >
                    {createSupplierMutation.isPending ? 'Creating...' : 'Create Supplier'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
