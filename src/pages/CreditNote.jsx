import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl, formatCurrency } from "@/utils";
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { FileCheck, Eye, Trash2 } from 'lucide-react';

export default function CreditNote() {
  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['creditNotes'],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_date');
      return all.filter(v => v.voucher_type === 'Credit Note');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creditNotes'] });
      toast.success('Credit note deleted');
    }
  });

  const columns = [
    { header: 'Note No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-emerald-600">{row.voucher_number || `CN-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Customer', accessor: 'party_name' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className="bg-emerald-100 text-emerald-700">{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`CreditNoteForm?id=${row.id}`)}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading credit notes..." />;

  return (
    <div>
      <PageHeader title="Credit Notes" subtitle="Sales returns & adjustments" primaryAction={{ label: 'New Credit Note', onClick: () => window.location.href = createPageUrl('CreditNoteForm') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={FileCheck} title="No Credit Notes" description="Create credit notes for sales returns" action={{ label: 'Create Credit Note', onClick: () => window.location.href = createPageUrl('CreditNoteForm') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}