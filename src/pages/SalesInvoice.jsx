import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from "@/utils";
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import VoucherItemsTable from '@/components/vouchers/VoucherItemsTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save, Printer, ArrowLeft } from 'lucide-react';

export default function SalesInvoice() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');

  const [formData, setFormData] = useState({
    voucher_type: 'Sales',
    voucher_number: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    party_ledger_id: '',
    party_name: '',
    reference_number: '',
    billing_address: '',
    narration: '',
    status: 'Confirmed'
  });

  const [items, setItems] = useState([{ stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }]);

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => base44.entities.Ledger.list()
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems'],
    queryFn: () => base44.entities.StockItem.list()
  });

  const { data: existingVoucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => base44.entities.Voucher.list(),
    enabled: !!voucherId,
    select: (data) => data.find(v => v.id === voucherId)
  });

  const { data: existingItems = [] } = useQuery({
    queryKey: ['voucherItems', voucherId],
    queryFn: async () => {
      const allItems = await base44.entities.VoucherItem.list();
      return allItems.filter(item => item.voucher_id === voucherId);
    },
    enabled: !!voucherId
  });

  useEffect(() => {
    if (existingVoucher) {
      setFormData({
        voucher_type: 'Sales',
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
        id: item.id,
        stock_item_id: item.stock_item_id,
        stock_item_name: item.stock_item_name,
        quantity: item.quantity,
        rate: item.rate,
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        vat_rate: item.vat_rate || 15,
        vat_amount: item.vat_amount || 0,
        amount: item.amount,
        total_amount: item.total_amount
      })));
    }
  }, [existingItems]);

  const partyLedgers = ledgers.filter(l => {
    return true; // Filter for sundry debtors in real implementation
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const grossAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0);
      const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);

      const voucherData = {
        ...formData,
        gross_amount: grossAmount,
        vat_amount: vatAmount,
        net_amount: netAmount
      };

      let voucher;
      if (voucherId) {
        voucher = await base44.entities.Voucher.update(voucherId, voucherData);
        // Delete old items
        for (const item of existingItems) {
          await base44.entities.VoucherItem.delete(item.id);
        }
      } else {
        voucher = await base44.entities.Voucher.create(voucherData);
      }

      // Create new items
      for (const item of items) {
        if (item.stock_item_id) {
          await base44.entities.VoucherItem.create({
            voucher_id: voucher.id,
            stock_item_id: item.stock_item_id,
            stock_item_name: item.stock_item_name,
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            discount_percent: parseFloat(item.discount_percent) || 0,
            discount_amount: parseFloat(item.discount_amount) || 0,
            vat_rate: parseFloat(item.vat_rate) || 15,
            vat_amount: parseFloat(item.vat_amount) || 0,
            amount: parseFloat(item.amount) || 0,
            total_amount: parseFloat(item.total_amount) || 0
          });
        }
      }

      return voucher;
    },
    onSuccess: (voucher) => {
      queryClient.invalidateQueries({ queryKey: ['salesVouchers'] });
      toast.success('Invoice saved successfully');
      window.location.href = createPageUrl('Sales');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'party_ledger_id') {
        const ledger = ledgers.find(l => l.id === value);
        if (ledger) {
          updated.party_name = ledger.name;
          updated.billing_address = ledger.address || '';
        }
      }
      return updated;
    });
  };

  const handleItemChange = (index, updatedItem) => {
    setItems(prev => prev.map((item, i) => i === index ? updatedItem : item));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const totals = {
    gross: items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
    vat: items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0),
    net: items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0)
  };

  if (isLoading && voucherId) return <LoadingSpinner text="Loading invoice..." />;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title={voucherId ? 'Edit Sales Invoice' : 'New Sales Invoice'}
        subtitle="Create or edit sales invoice"
        backUrl="Sales"
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  label="Invoice Number"
                  name="voucher_number"
                  value={formData.voucher_number}
                  onChange={handleChange}
                  placeholder="Auto-generated"
                />
                <FormField
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Reference No"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                />
                <FormField
                  label="Status"
                  name="status"
                  type="select"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Confirmed', label: 'Confirmed' },
                    { value: 'Cancelled', label: 'Cancelled' }
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Customer"
                  name="party_ledger_id"
                  type="select"
                  value={formData.party_ledger_id}
                  onChange={handleChange}
                  options={partyLedgers.map(l => ({ value: l.id, label: l.name }))}
                />
                <FormField
                  label="Customer Name"
                  name="party_name"
                  value={formData.party_name}
                  onChange={handleChange}
                />
              </div>
              <div className="mt-4">
                <FormField
                  label="Billing Address"
                  name="billing_address"
                  type="textarea"
                  value={formData.billing_address}
                  onChange={handleChange}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherItemsTable
                items={items}
                stockItems={stockItems}
                onItemChange={handleItemChange}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
              />
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between w-64">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{totals.gross.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between w-64">
                  <span className="text-slate-600">VAT (15%):</span>
                  <span className="font-medium">{totals.vat.toFixed(2)} SAR</span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-emerald-600">{totals.net.toFixed(2)} SAR</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Narration */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                label="Narration / Notes"
                name="narration"
                type="textarea"
                value={formData.narration}
                onChange={handleChange}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.location.href = createPageUrl('Sales')}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}