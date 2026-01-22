import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { ClipboardList, Eye, Trash2 } from 'lucide-react';

export default function SalesOrder() {
  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: async () => {
      const all = await base44.entities.Voucher.list('-created_date');
      return all.filter(v => v.voucher_type === 'Sales Order');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesOrders'] });
      toast.success('Sales order deleted');
    }
  });

  const columns = [
    { header: 'Order No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-emerald-600">{row.voucher_number || `SO-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Customer', accessor: 'party_name' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{parseFloat(row.net_amount || 0).toFixed(2)} SAR</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className={row.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>{row.status || 'Draft'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`SalesOrderForm?id=${row.id}`)}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading sales orders..." />;

  return (
    <div>
      <PageHeader title="Sales Orders" subtitle="Manage customer orders" primaryAction={{ label: 'New Order', onClick: () => window.location.href = createPageUrl('SalesOrderForm') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No Sales Orders" description="Create sales orders" action={{ label: 'Create Order', onClick: () => window.location.href = createPageUrl('SalesOrderForm') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}