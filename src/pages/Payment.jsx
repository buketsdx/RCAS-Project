import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import { useConfirm } from '@/context/ConfirmContext';
import { createPageUrl, formatCurrency } from "@/utils";
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { CreditCard, Pencil, Trash2 } from 'lucide-react';

export default function Payment() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['paymentVouchers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_at');
      return all.filter(v => v.voucher_type === 'Payment' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // 1. Fetch dependencies directly using raw query
      let zatcaToDelete = [];
      try {
        const { data: rawZatca } = await rcas.from('zatca_invoices').select('*').eq('voucher_id', id);
        zatcaToDelete = rawZatca || [];
      } catch {
        const allZatca = await rcas.entities.ZATCAInvoice.list();
        zatcaToDelete = allZatca.filter(z => String(z.voucher_id) === String(id));
      }
      for (const z of zatcaToDelete) {
        await rcas.entities.ZATCAInvoice.delete(z.id);
      }

      // 2. Fetch and delete Bank Reconciliation records
      let bankRecToDelete = [];
      try {
        const { data: rawBankRecs } = await rcas.from('bank_reconciliations').select('*').eq('voucher_id', id);
        bankRecToDelete = rawBankRecs || [];
      } catch {
        const allBankRecs = await rcas.entities.BankReconciliation.list();
        bankRecToDelete = allBankRecs.filter(b => String(b.voucher_id) === String(id));
      }
      for (const b of bankRecToDelete) {
        await rcas.entities.BankReconciliation.delete(b.id);
      }

      // 3. Delete associated ledger entries
      let entriesToDelete = [];
      try {
        const { data: rawEntries } = await rcas.from('voucher_ledger_entries').select('*').eq('voucher_id', id);
        entriesToDelete = rawEntries || [];
      } catch {
        const allEntries = await rcas.entities.VoucherLedgerEntry.list();
        entriesToDelete = allEntries.filter(e => String(e.voucher_id) === String(id));
      }
      for (const entry of entriesToDelete) {
        await rcas.entities.VoucherLedgerEntry.delete(entry.id);
      }
      
      // 4. Delete the voucher
      return rcas.entities.Voucher.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentVouchers', selectedCompanyId] });
      toast.success('Payment deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete payment: ' + error.message);
    }
  });

  const columns = [
    { header: 'Payment No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-orange-600">{row.voucher_number || `PAY-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Paid To', accessor: 'party_name', render: (row) => row.party_name || '-' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold text-red-600">-{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className="bg-emerald-100 text-emerald-700">{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl("payment", row.id)}><Pencil className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { 
            if (await confirm({
              title: 'Delete Payment',
              description: 'Are you sure you want to delete this payment? This action cannot be undone.',
              variant: 'destructive',
              confirmText: 'Delete'
            })) {
              deleteMutation.mutate(row.id); 
            }
          }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading payments..." />;

  return (
    <div>
      <PageHeader title="Payment Vouchers" subtitle="Manage cash/bank payments" primaryAction={{ label: 'New Payment', onClick: () => window.location.href = createPageUrl('PaymentVoucher') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={CreditCard} title="No Payments" description="Create your first payment voucher" action={{ label: 'Create Payment', onClick: () => window.location.href = createPageUrl('PaymentVoucher') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}