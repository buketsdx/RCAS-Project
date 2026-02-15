import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ReorderStatus() {
  const { selectedCompanyId } = useCompany();
  const { data: items = [], isLoading } = useQuery({ 
    queryKey: ['stockItems', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.StockItem.list();
      return list.filter(i => String(i.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  
  const { data: units = [] } = useQuery({ 
    queryKey: ['units', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Unit.list();
      return list.filter(u => String(u.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const itemsWithReorder = items.filter(item => item.reorder_level);
  
  const getStatus = (item) => {
    const qty = parseFloat(item.current_qty || 0);
    const reorder = parseFloat(item.reorder_level || 0);
    if (qty <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-700', priority: 1 };
    if (qty <= reorder) return { status: 'Below Reorder', color: 'bg-yellow-100 text-yellow-700', priority: 2 };
    return { status: 'Sufficient', color: 'bg-emerald-100 text-emerald-700', priority: 3 };
  };

  const sortedItems = itemsWithReorder
    .map(item => ({ ...item, ...getStatus(item) }))
    .sort((a, b) => a.priority - b.priority);

  const criticalCount = sortedItems.filter(i => i.priority <= 2).length;

  const columns = [
    {
      header: 'Item',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img src={row.image_url} alt={row.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-slate-500">{row.part_number || ''}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Current Stock',
      accessor: 'current_qty',
      render: (row) => {
        const unit = units.find(u => u.id === row.unit_id);
        return `${parseFloat(row.current_qty || 0).toFixed(2)} ${unit?.name || ''}`;
      }
    },
    {
      header: 'Reorder Level',
      accessor: 'reorder_level',
      render: (row) => {
        const unit = units.find(u => u.id === row.unit_id);
        return `${parseFloat(row.reorder_level || 0).toFixed(2)} ${unit?.name || ''}`;
      }
    },
    {
      header: 'Shortage',
      render: (row) => {
        const shortage = parseFloat(row.reorder_level || 0) - parseFloat(row.current_qty || 0);
        if (shortage <= 0) return '-';
        const unit = units.find(u => u.id === row.unit_id);
        return <span className="text-red-600 font-medium">{shortage.toFixed(2)} {unit?.name || ''}</span>;
      }
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge className={row.color}>
          {row.priority === 1 && <AlertTriangle className="h-3 w-3 mr-1" />}
          {row.priority === 3 && <CheckCircle className="h-3 w-3 mr-1" />}
          {row.status}
        </Badge>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading reorder status..." />;

  return (
    <div>
      <PageHeader 
        title="Reorder Status" 
        subtitle={criticalCount > 0 ? `${criticalCount} items need attention` : 'All items are sufficiently stocked'}
      />

      {itemsWithReorder.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">No items have reorder levels set</p>
          <p className="text-sm text-slate-400 mt-1">Set reorder levels in Stock Items to track inventory alerts</p>
        </div>
      ) : (
        <DataTable columns={columns} data={sortedItems} />
      )}
    </div>
  );
}
