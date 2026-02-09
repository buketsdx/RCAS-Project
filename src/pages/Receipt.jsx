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
import { Wallet, Eye, Trash2 } from 'lucide-react';

export default function Receipt() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { selectedCompanyId } = useCompany();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['receiptVouchers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_date');
      return all.filter(v => v.voucher_type === 'Receipt' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receiptVouchers', selectedCompanyId] });
      toast.success('Receipt deleted');
    }
  });

  const columns = [
    { header: 'Receipt No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-purple-600">{row.voucher_number || `REC-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Received From', accessor: 'party_name', render: (row) => row.party_name || '-' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold text-emerald-600">+{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className="bg-emerald-100 text-emerald-700">{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl("receipt", row.id)}><Eye className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { 
            if (await confirm({
              title: 'Delete Receipt',
              description: 'Are you sure you want to delete this receipt? This action cannot be undone.',
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

  if (isLoading) return <LoadingSpinner text="Loading receipts..." />;

  return (
    <div>
      <PageHeader title="Receipt Vouchers" subtitle="Manage cash/bank receipts" primaryAction={{ label: 'New Receipt', onClick: () => window.location.href = createPageUrl('ReceiptVoucher') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={Wallet} title="No Receipts" description="Create your first receipt voucher" action={{ label: 'Create Receipt', onClick: () => window.location.href = createPageUrl('ReceiptVoucher') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}