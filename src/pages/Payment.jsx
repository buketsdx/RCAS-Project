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

  const { data: voucherEntries = [] } = useQuery({
    queryKey: ['paymentVoucherEntries', selectedCompanyId],
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