import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl, generateVoucherCode } from "@/utils";
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LedgerEntriesTable from '@/components/vouchers/LedgerEntriesTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save } from 'lucide-react';

export default function PaymentVoucher() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');

  const [formData, setFormData] = useState({
    voucher_type: 'Payment',
    voucher_number: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    party_name: '',
    narration: '',
    net_amount: 0
  });

  const [entries, setEntries] = useState([
    { ledger_id: '', debit_amount: 0, credit_amount: 0 },
    { ledger_id: '', debit_amount: 0, credit_amount: 0 }
  ]);

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Ledger.list();
      return all.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: existingVoucher, isLoading } = useQuery({
    queryKey: ['voucher', voucherId, selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.find(v => v.id === voucherId && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!voucherId && !!selectedCompanyId,
    onSuccess: (voucher) => {
      if (voucher) {
        setFormData({
          voucher_type: 'Payment',
          voucher_number: voucher.voucher_number || '',
          date: voucher.date || format(new Date(), 'yyyy-MM-dd'),
          party_name: voucher.party_name || '',
          narration: voucher.narration || '',
          net_amount: voucher.net_amount || 0
        });
      }
    }
  });

  const { data: existingEntries = [] } = useQuery({
    queryKey: ['voucherEntries', voucherId],
    queryFn: async () => {
      const all = await rcas.entities.VoucherLedgerEntry.list();
      return all.filter(e => e.voucher_id === voucherId);
    },
    enabled: !!voucherId && !!existingVoucher,
    onSuccess: (entriesFromServer) => {
      if (entriesFromServer && entriesFromServer.length > 0) {
        setEntries(entriesFromServer.map(e => ({
          id: e.id,
          ledger_id: e.ledger_id,
          ledger_name: e.ledger_name,
          debit_amount: e.debit_amount || 0,
          credit_amount: e.credit_amount || 0
        })));
      }
    }
  });

  useEffect(() => {
    if (!voucherId && !formData.voucher_number) {
      generateVoucherCode('Payment').then(code => {
        setFormData(prev => ({
          ...prev,
          voucher_number: code
        }));
      });
    }
  }, [voucherId, formData.voucher_number]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit_amount) || 0), 0);
      const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit_amount) || 0), 0);
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) throw new Error('Voucher is not balanced');

      const voucherData = { ...formData, net_amount: totalCredit, company_id: selectedCompanyId };

      let voucher;
      if (voucherId) {
        voucher = await rcas.entities.Voucher.update(voucherId, voucherData);
        for (const entry of existingEntries) await rcas.entities.VoucherLedgerEntry.delete(entry.id);
      } else {
        voucher = await rcas.entities.Voucher.create(voucherData);
      }

      for (const entry of entries) {
        if (entry.ledger_id && (entry.debit_amount || entry.credit_amount)) {
          await rcas.entities.VoucherLedgerEntry.create({
            voucher_id: voucher.id, ledger_id: entry.ledger_id, ledger_name: entry.ledger_name,
            debit_amount: parseFloat(entry.debit_amount) || 0, credit_amount: parseFloat(entry.credit_amount) || 0
          });
        }
      }
      return voucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentVouchers'] });
      toast.success('Payment saved');
      window.location.href = createPageUrl('Payment');
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
      <PageHeader title={voucherId ? 'Edit Payment' : 'New Payment'} subtitle="Create or edit payment voucher" backUrl="Payment" />
      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }}>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Payment Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Payment No" name="voucher_number" value={formData.voucher_number} onChange={handleChange} placeholder="Auto" />
                <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                <FormField label="Paid To" name="party_name" value={formData.party_name} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Accounting Entries</CardTitle></CardHeader>
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
            <Button type="button" variant="outline" onClick={() => window.location.href = createPageUrl('Payment')}>Cancel</Button>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />{saveMutation.isPending ? 'Saving...' : 'Save Payment'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
