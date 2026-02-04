import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useCompany } from '@/context/CompanyContext';
import { createPageUrl, formatCurrency } from "@/utils";
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { ArrowRightLeft, Eye, Trash2 } from 'lucide-react';

export default function Contra() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['contraVouchers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_date');
      return all.filter(v => v.voucher_type === 'Contra' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contraVouchers', selectedCompanyId] });
      toast.success('Contra deleted');
    }
  });

  const columns = [
    { header: 'Contra No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-cyan-600">{row.voucher_number || `CTR-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Narration', accessor: 'narration', render: (row) => row.narration || '-' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className="bg-emerald-100 text-emerald-700">{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`ContraVoucher?id=${row.id}`)}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading contra entries..." />;

  return (
    <div>
      <PageHeader title="Contra Vouchers" subtitle="Bank to bank / cash transfers" primaryAction={{ label: 'New Contra', onClick: () => window.location.href = createPageUrl('ContraVoucher') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={ArrowRightLeft} title="No Contra Entries" description="Create contra for fund transfers" action={{ label: 'Create Contra', onClick: () => window.location.href = createPageUrl('ContraVoucher') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}