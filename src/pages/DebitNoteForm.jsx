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
import { Save } from 'lucide-react';

export default function DebitNoteForm() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');

  const [formData, setFormData] = useState({
    voucher_type: 'Debit Note',
    voucher_number: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    party_ledger_id: '',
    party_name: '',
    reference_number: '',
    narration: '',
    status: 'Confirmed'
  });

  const [items, setItems] = useState([{ stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }]);

  const { data: ledgers = [] } = useQuery({ queryKey: ['ledgers'], queryFn: () => base44.entities.Ledger.list() });
  const { data: stockItems = [] } = useQuery({ queryKey: ['stockItems'], queryFn: () => base44.entities.StockItem.list() });

  const { data: existingVoucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => base44.entities.Voucher.list(),
    enabled: !!voucherId,
    select: (data) => data.find(v => v.id === voucherId)
  });

  const { data: existingItems = [] } = useQuery({
    queryKey: ['voucherItems', voucherId],
    queryFn: async () => {
      const all = await base44.entities.VoucherItem.list();
      return all.filter(item => item.voucher_id === voucherId);
    },
    enabled: !!voucherId
  });

  useEffect(() => {
    if (existingVoucher) {
      setFormData({
        voucher_type: 'Debit Note',
        voucher_number: existingVoucher.voucher_number || '',
        date: existingVoucher.date || format(new Date(), 'yyyy-MM-dd'),
        party_ledger_id: existingVoucher.party_ledger_id || '',
        party_name: existingVoucher.party_name || '',
        reference_number: existingVoucher.reference_number || '',
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
        vat_rate: item.vat_rate || 15, vat_amount: item.vat_amount || 0,
        amount: item.amount, total_amount: item.total_amount
      })));
    }
  }, [existingItems]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const grossAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0);
      const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);

      const voucherData = { ...formData, gross_amount: grossAmount, vat_amount: vatAmount, net_amount: netAmount };

      let voucher;
      if (voucherId) {
        voucher = await base44.entities.Voucher.update(voucherId, voucherData);
        for (const item of existingItems) await base44.entities.VoucherItem.delete(item.id);
      } else {
        voucher = await base44.entities.Voucher.create(voucherData);
      }

      for (const item of items) {
        if (item.stock_item_id) {
          await base44.entities.VoucherItem.create({
            voucher_id: voucher.id, stock_item_id: item.stock_item_id, stock_item_name: item.stock_item_name,
            quantity: parseFloat(item.quantity) || 0, rate: parseFloat(item.rate) || 0,
            discount_percent: parseFloat(item.discount_percent) || 0,
            vat_rate: parseFloat(item.vat_rate) || 15, vat_amount: parseFloat(item.vat_amount) || 0,
            amount: parseFloat(item.amount) || 0, total_amount: parseFloat(item.total_amount) || 0
          });
        }
      }
      return voucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debitNotes'] });
      toast.success('Debit note saved');
      window.location.href = createPageUrl('DebitNote');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'party_ledger_id') {
        const ledger = ledgers.find(l => l.id === value);
        if (ledger) updated.party_name = ledger.name;
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
    <div className="max-w-6xl mx-auto">
      <PageHeader title={voucherId ? 'Edit Debit Note' : 'New Debit Note'} backUrl="DebitNote" />
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Debit Note Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField label="Note Number" name="voucher_number" value={formData.voucher_number} onChange={handleChange} placeholder="Auto" />
                <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                <FormField label="Original Invoice" name="reference_number" value={formData.reference_number} onChange={handleChange} />
                <FormField label="Supplier" name="party_ledger_id" type="select" value={formData.party_ledger_id} onChange={handleChange} options={ledgers.map(l => ({ value: l.id, label: l.name }))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Return Items</CardTitle></CardHeader>
            <CardContent>
              <VoucherItemsTable items={items} stockItems={stockItems} onItemChange={(i, item) => setItems(prev => prev.map((it, idx) => idx === i ? item : it))} onAddItem={() => setItems(prev => [...prev, { stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }])} onRemoveItem={(i) => setItems(prev => prev.filter((_, idx) => idx !== i))} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between w-64"><span>Subtotal:</span><span>{totals.gross.toFixed(2)} SAR</span></div>
                <div className="flex justify-between w-64"><span>VAT:</span><span>{totals.vat.toFixed(2)} SAR</span></div>
                <div className="flex justify-between w-64 pt-2 border-t font-bold"><span>Total:</span><span className="text-blue-600">{totals.net.toFixed(2)} SAR</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.location.href = createPageUrl('DebitNote')}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}