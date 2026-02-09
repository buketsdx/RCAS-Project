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
import { Truck, Eye, Trash2 } from 'lucide-react';

export default function PurchaseOrder() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['purchaseOrders', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_date');
      return all.filter(v => v.voucher_type === 'Purchase Order' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders', selectedCompanyId] });
      toast.success('Purchase order deleted');
    }
  });

  const columns = [
    { header: 'Order No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-blue-600">{row.voucher_number || `PO-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Supplier', accessor: 'party_name' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className={row.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>{row.status || 'Draft'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl("purchase_order", row.id)}><Eye className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={async () => { 
            if (await confirm({
              title: 'Delete Purchase Order',
              description: 'Are you sure you want to delete this purchase order? This action cannot be undone.',
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

  if (isLoading) return <LoadingSpinner text="Loading purchase orders..." />;

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Manage supplier orders" primaryAction={{ label: 'New Order', onClick: () => window.location.href = createPageUrl('PurchaseOrderForm') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={Truck} title="No Purchase Orders" description="Create purchase orders" action={{ label: 'Create Order', onClick: () => window.location.href = createPageUrl('PurchaseOrderForm') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}