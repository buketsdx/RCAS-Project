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
import { ShoppingCart, Eye, Printer, Trash2 } from 'lucide-react';

export default function Purchase() {
  const { company, selectedCompanyId } = useCompany();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Stock Purchases',
          subtitle: 'Manage your stock purchases',
          newInvoice: 'Purchase Stock',
          noInvoices: 'No Stock Purchases',
          createFirst: 'Record First Purchase'
        };
      case 'Restaurant':
        return {
          title: 'Ingredient Purchases',
          subtitle: 'Manage your ingredient purchases',
          newInvoice: 'Purchase Ingredients',
          noInvoices: 'No Ingredient Purchases',
          createFirst: 'Record First Purchase'
        };
      default:
        return {
          title: 'Purchase Invoices',
          subtitle: 'Manage your purchase transactions',
          newInvoice: 'New Invoice',
          noInvoices: 'No Purchase Invoices',
          createFirst: 'Create Invoice'
        };
    }
  };

  const terms = getTerminology();

  const queryClient = useQueryClient();

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['purchaseVouchers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Voucher.list('-created_date');
      return all.filter(v => v.voucher_type === 'Purchase' && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Voucher.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseVouchers', selectedCompanyId] });
      toast.success('Invoice deleted');
    }
  });

  const columns = [
    { header: 'Invoice No', accessor: 'voucher_number', render: (row) => <span className="font-semibold text-blue-600">{row.voucher_number || `PUR-${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Supplier', accessor: 'party_name', render: (row) => row.party_name || '-' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => <span className="font-semibold">{formatCurrency(parseFloat(row.net_amount || 0), 'SAR')}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className={row.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>{row.status || 'Confirmed'}</Badge> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link to={createPageUrl(`PurchaseInvoice?id=${row.id}`)}><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button></Link>
          <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading purchase invoices..." />;

  return (
    <div>
      <PageHeader title={terms.title} subtitle={terms.subtitle} primaryAction={{ label: terms.newInvoice, onClick: () => window.location.href = createPageUrl('PurchaseInvoice') }} />
      {vouchers.length === 0 ? (
        <EmptyState icon={ShoppingCart} title={terms.noInvoices} description={terms.createFirst} action={{ label: terms.newInvoice, onClick: () => window.location.href = createPageUrl('PurchaseInvoice') }} />
      ) : (
        <DataTable columns={columns} data={vouchers} />
      )}
    </div>
  );
}