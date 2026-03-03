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
import { BookOpen, Pencil, Trash2 } from 'lucide-react';

export default function Journal() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['journalVouchers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_at');
      return all.filter(v => v.voucher_type === 'Journal' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: voucherEntries = [] } = useQuery({
    queryKey: ['journalVoucherEntries', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.VoucherLedgerEntry.list();
      return all;
    },
    enabled: !!selectedCompanyId
  });

  const { data: zatcaInvoices = [] } = useQuery({
    queryKey: ['zatcaInvoices', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.ZATCAInvoice.list();
      return all.filter(z => String(z.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: bankReconciliations = [] } = useQuery({
    queryKey: ['bankReconciliations', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.BankReconciliation.list();
      return all.filter(b => String(b.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // 1. Delete ZATCA records first (if any)
      const zatcaToDelete = zatcaInvoices.filter(z => z.voucher_id === id);
      for (const z of zatcaToDelete) {
        await rcas.entities.ZATCAInvoice.delete(z.id);
      }

      // 2. Delete Bank Reconciliation records first (if any)
      const bankRecToDelete = bankReconciliations.filter(b => b.voucher_id === id);
      for (const b of bankRecToDelete) {
        await rcas.entities.BankReconciliation.delete(b.id);
      }

      // 3. Delete associated ledger entries first
      const entriesToDelete = voucherEntries.filter(e => e.voucher_id === id);
      for (const entry of entriesToDelete) {
        await rcas.entities.VoucherLedgerEntry.delete(entry.id);
      }
      // 4. Delete the voucher
      return rcas.entities.Voucher.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalVouchers', selectedCompanyId] });
      toast.success('Journal deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete journal entry: ' + error.message);
    }
  });

  const columns = [
    { header: 'Journal No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-slate-600">{row.voucher_number || `JRN-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Narration', accessor: 'narration', render: (row) => <span className="truncate max-w-xs block">{row.narration || '-'}</span> },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className="bg-emerald-100 text-emerald-700">{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl(`JournalVoucher?id=${row.id}`)}><Pencil className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { 
            if (await confirm({
              title: 'Delete Journal Entry',
              description: 'Are you sure you want to delete this journal entry? This action cannot be undone.',
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

  if (isLoading) return <LoadingSpinner text="Loading journal entries..." />;

  return (
    <div>
      <PageHeader title="Journal Vouchers" subtitle="Manual accounting entries" primaryAction={{ label: 'New Journal', onClick: () => window.location.href = createPageUrl('JournalVoucher') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={BookOpen} title="No Journal Entries" description="Create journal entries" action={{ label: 'Create Journal', onClick: () => window.location.href = createPageUrl('JournalVoucher') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}