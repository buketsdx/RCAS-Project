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
import { FileInput, Pencil, Trash2 } from 'lucide-react';

export default function DebitNote() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['debitNotes', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_at');
      return all.filter(v => v.voucher_type === 'Debit Note' && String(v.company_id) === String(selectedCompanyId));
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

      // 2. Delete associated items first
      let itemsToDelete = [];
      try {
        const { data: rawItems } = await rcas.from('voucher_items').select('*').eq('voucher_id', id);
        itemsToDelete = rawItems || [];
      } catch {
        const allItems = await rcas.entities.VoucherItem.list();
        itemsToDelete = allItems.filter(item => String(item.voucher_id) === String(id));
      }
      for (const item of itemsToDelete) {
        await rcas.entities.VoucherItem.delete(item.id);
      }
      
      // 3. Delete the voucher
      return rcas.entities.Voucher.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debitNotes', selectedCompanyId] });
      toast.success('Debit note deleted');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Failed to delete debit note: ' + error.message);
    }
  });

  const columns = [
    { header: 'Note No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-blue-600">{row.voucher_number || `DN-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Supplier', accessor: 'party_name' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className="bg-emerald-100 text-emerald-700">{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl(`DebitNoteForm?id=${row.id}`)}><Pencil className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { 
            if (await confirm({
              title: 'Delete Debit Note',
              description: 'Are you sure you want to delete this debit note? This action cannot be undone.',
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

  if (isLoading) return <LoadingSpinner text="Loading debit notes..." />;

  return (
    <div>
      <PageHeader title="Debit Notes" subtitle="Purchase returns & adjustments" primaryAction={{ label: 'New Debit Note', onClick: () => window.location.href = createPageUrl('DebitNoteForm') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={FileInput} title="No Debit Notes" description="Create debit notes for purchase returns" action={{ label: 'Create Debit Note', onClick: () => window.location.href = createPageUrl('DebitNoteForm') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}