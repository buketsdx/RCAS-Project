import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '../context/CompanyContext';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

export default function StockSummary() {
  const { type } = useCompany();
  const { data: items = [], isLoading } = useQuery({ queryKey: ['stockItems'], queryFn: () => rcas.entities.StockItem.list() });

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Product Inventory',
          subtitle: 'Overview of retail products and consumables',
          item: 'Product',
          qty: 'Quantity'
        };
      case 'Restaurant':
        return {
          title: 'Kitchen Inventory',
          subtitle: 'Overview of ingredients and menu items',
          item: 'Item',
          qty: 'Stock'
        };
      default:
        return {
          title: 'Stock Summary',
          subtitle: 'Current inventory overview',
          item: 'Item',
          qty: 'Stock Qty'
        };
    }
  };

  const terms = getTerminology();
  const { data: groups = [] } = useQuery({ queryKey: ['stockGroups'], queryFn: () => rcas.entities.StockGroup.list() });
  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => rcas.entities.Unit.list() });

  const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.current_qty || 0) * parseFloat(item.cost_price || item.opening_rate || 0)), 0);
  const lowStockItems = items.filter(item => item.reorder_level && parseFloat(item.current_qty || 0) <= parseFloat(item.reorder_level));
  const outOfStockItems = items.filter(item => parseFloat(item.current_qty || 0) <= 0);

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
      header: 'Group',
      accessor: 'group_id',
      render: (row) => {
        const group = groups.find(g => g.id === row.group_id);
        return group ? <Badge variant="outline">{group.name}</Badge> : '-';
      }
    },
    {
      header: terms.qty,
      accessor: 'current_qty',
      render: (row) => {
        const qty = parseFloat(row.current_qty || 0);
        const unit = units.find(u => u.id === row.unit_id);
        const isLow = row.reorder_level && qty <= parseFloat(row.reorder_level);
        return (
          <span className={`font-semibold ${qty <= 0 ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-slate-700'}`}>
            {qty.toFixed(2)} {unit?.name || ''}
            {qty <= 0 && <AlertTriangle className="h-4 w-4 inline ml-1" />}
          </span>
        );
      }
    },
    {
      header: 'Rate',
      accessor: 'cost_price',
      render: (row) => formatCurrency(parseFloat(row.cost_price || row.opening_rate || 0), 'SAR')
    },
    {
      header: 'Value',
      render: (row) => {
        const value = parseFloat(row.current_qty || 0) * parseFloat(row.cost_price || row.opening_rate || 0);
        return <span className="font-semibold">{formatCurrency(value, 'SAR')}</span>;
      }
    }
  ];

  if (isLoading) return <LoadingSpinner text={`Loading ${terms.title.toLowerCase()}...`} />;

  return (
    <div>
      <PageHeader title={terms.title} subtitle={terms.subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title={`Total ${terms.item}s`} value={items.length} icon={Package} />
        <StatCard title="Total Value" value={formatCurrency(totalValue, 'SAR')} icon={TrendingUp} />
        <StatCard title={`Low ${terms.qty}`} value={lowStockItems.length} icon={AlertTriangle} className={lowStockItems.length > 0 ? 'border-yellow-200' : ''} />
        <StatCard title={`Out of ${terms.qty}`} value={outOfStockItems.length} icon={AlertTriangle} className={outOfStockItems.length > 0 ? 'border-red-200' : ''} />
      </div>

      <DataTable columns={columns} data={items} />
    </div>
  );
}