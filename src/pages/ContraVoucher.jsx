import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from "@/utils";
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LedgerEntriesTable from '@/components/vouchers/LedgerEntriesTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save } from 'lucide-react';

export default function ContraVoucher() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');

  const [formData, setFormData] = useState({
    voucher_type: 'Contra',
    voucher_number: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    narration: '',
    net_amount: 0
  });

  const [entries, setEntries] = useState([
    { ledger_id: '', debit_amount: 0, credit_amount: 0 },
    { ledger_id: '', debit_amount: 0, credit_amount: 0 }
  ]);

  const { data: ledgers = [] } = useQuery({ queryKey: ['ledgers'], queryFn: () => base44.entities.Ledger.list() });

  const { data: existingVoucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => base44.entities.Voucher.list(),
    enabled: !!voucherId,
    select: (data) => data.find(v => v.id === voucherId)
  });

  const { data: existingEntries = [] } = useQuery({
    queryKey: ['voucherEntries', voucherId],
    queryFn: async () => {
      const all = await base44.entities.VoucherLedgerEntry.list();
      return all.filter(e => e.voucher_id === voucherId);
    },
    enabled: !!voucherId
  });

  useEffect(() => {
    if (existingVoucher) {
      setFormData({
        voucher_type: 'Contra',
        voucher_number: existingVoucher.voucher_number || '',
        date: existingVoucher.date || format(new Date(), 'yyyy-MM-dd'),
        narration: existingVoucher.narration || '',
        net_amount: existingVoucher.net_amount || 0
      });
    }
  }, [existingVoucher]);

  useEffect(() => {
    if (existingEntries.length > 0) {
      setEntries(existingEntries.map(e => ({
        id: e.id, ledger_id: e.ledger_id, ledger_name: e.ledger_name,
        debit_amount: e.debit_amount || 0, credit_amount: e.credit_amount || 0
      })));
    }
  }, [existingEntries]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
      const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error('Voucher is not balanced');

      const voucherData = { ...formData, net_amount: totalDebit };

      let voucher;
      if (voucherId) {
        voucher = await base44.entities.Voucher.update(voucherId, voucherData);
        for (const entry of existingEntries) await base44.entities.VoucherLedgerEntry.delete(entry.id);
      } else {
        voucher = await base44.entities.Voucher.create(voucherData);
      }

      for (const entry of entries) {
        if (entry.ledger_id && (entry.debit_amount || entry.credit_amount)) {
          await base44.entities.VoucherLedgerEntry.create({
            voucher_id: voucher.id, ledger_id: entry.ledger_id, ledger_name: entry.ledger_name,
            debit_amount: parseFloat(entry.debit_amount) || 0, credit_amount: parseFloat(entry.credit_amount) || 0
          });
        }
      }
      return voucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contraVouchers'] });
      toast.success('Contra saved');
      window.location.href = createPageUrl('Contra');
    },
    onError: (error) => toast.error(error.message)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading && voucherId) return <LoadingSpinner text="Loading..." />;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title={voucherId ? 'Edit Contra' : 'New Contra'} subtitle="Bank / Cash transfer" backUrl="Contra" />
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Contra Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Contra No" name="voucher_number" value={formData.voucher_number} onChange={handleChange} placeholder="Auto" />
                <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Fund Transfer Entries</CardTitle></CardHeader>
            <CardContent>
              <LedgerEntriesTable
                entries={entries}
                ledgers={ledgers}
                onEntryChange={(i, entry) => setEntries(prev => prev.map((e, idx) => idx === i ? entry : e))}
                onAddEntry={() => setEntries(prev => [...prev, { ledger_id: '', debit_amount: 0, credit_amount: 0 }])}
                onRemoveEntry={(i) => setEntries(prev => prev.filter((_, idx) => idx !== i))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormField label="Narration" name="narration" type="textarea" value={formData.narration} onChange={handleChange} rows={2} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.location.href = createPageUrl('Contra')}>Cancel</Button>
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? 'Saving...' : 'Save Contra'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}