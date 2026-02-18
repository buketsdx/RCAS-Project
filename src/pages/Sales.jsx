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
import { TrendingUp, Plus, Eye, Printer, Trash2 } from 'lucide-react';

export default function Sales() {
  const { company, selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Service Invoices',
          subtitle: 'Manage your service transactions',
          newInvoice: 'New Service',
          noInvoices: 'No Service Invoices',
          createFirst: 'Create First Service'
        };
      case 'Restaurant':
        return {
          title: 'Order Invoices',
          subtitle: 'Manage your order transactions',
          newInvoice: 'New Order',
          noInvoices: 'No Order Invoices',
          createFirst: 'Create First Order'
        };
      default:
        return {
          title: 'Sales Invoices',
          subtitle: 'Manage your sales transactions',
          newInvoice: 'New Invoice',
          noInvoices: 'No Sales Invoices',
          createFirst: 'Create Invoice'
        };
    }
  };

  const terms = getTerminology();

  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['salesVouchers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_at');
      return all.filter(v => v.voucher_type === 'Sales' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: voucherItems = [] } = useQuery({
    queryKey: ['salesVoucherItems', selectedCompanyId],
    queryFn: async () => {
      const allItems = await rcas.entities.VoucherItem.list();
      return allItems;
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesVouchers', selectedCompanyId] });
      toast.success('Invoice deleted');
    }
  });

  const columns = [
    {
      header: 'Invoice No',
      accessor: 'voucher_number',
      render: (row) => <span className="font-semibold text-emerald-600">{row.voucher_number || `INV-${row.id?.slice(-6)}`}</span>
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-'
    },
    {
      header: 'Customer',
      accessor: 'party_name',
      render: (row) => row.party_name || '-'
    },
    {
      header: 'Amount',
      accessor: 'net_amount',
      render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <Badge className={row.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
          {row.status || 'Confirmed'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => {
        const rowItems = voucherItems.filter(item => item.voucher_id === row.id);
        return (
          <div className="flex items-center gap-2">
            <Link 
              to={createPageUrl(`SalesInvoice?id=${row.id}`)} 
              state={{ voucher: row, items: rowItems }}
            >
              <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
            </Link>
            <Link to={createPageUrl(`PrintInvoice?id=${row.id}&type=sales`)}>
              <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={async () => { 
              if (await confirm({
                title: `Delete ${terms.title.slice(0, -1)}`,
                description: `Are you sure you want to delete this invoice? This action cannot be undone.`,
                variant: 'destructive',
                confirmText: 'Delete'
              })) {
                deleteMutation.mutate(row.id); 
              }
            }}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      }
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading sales invoices..." />;

  return (
    <div>
      <PageHeader
        title={terms.title}
        subtitle={terms.subtitle}
        primaryAction={{ label: terms.newInvoice, onClick: () => window.location.href = createPageUrl('SalesInvoice') }}
      />
      {vouchers.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={terms.noInvoices}
          description={terms.createFirst}
          action={{ label: terms.newInvoice, onClick: () => window.location.href = createPageUrl('SalesInvoice') }}
        />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}
