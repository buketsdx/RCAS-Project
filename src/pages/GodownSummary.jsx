import React from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, Package } from 'lucide-react';
import { useCompany } from '@/context/CompanyContext';

export default function GodownSummary() {
  const { type, selectedCompanyId } = useCompany();
  const { data: godowns = [], isLoading } = useQuery({ 
    queryKey: ['godowns', selectedCompanyId], 
    queryFn: async () => {
      const all = await rcas.entities.Godown.list();
      return all.filter(g => String(g.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  const { data: items = [] } = useQuery({ 
    queryKey: ['stockItems', selectedCompanyId], 
    queryFn: async () => {
      const all = await rcas.entities.StockItem.list();
      return all.filter(i => String(i.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
      case 'Restaurant':
        return {
          title: 'Store Summary',
          subtitle: 'Location-wise stock overview',
          entity: 'Store',
          plural: 'Stores'
        };
      default:
        return {
          title: 'Godown Summary',
          subtitle: 'Warehouse-wise stock overview',
          entity: 'Godown',
          plural: 'Godowns'
        };
    }
  };

  const t = getTerminology();

  const totalItems = items.length;
  const totalValue = items.reduce((sum, item) => sum + (parseFloat(item.current_qty || 0) * parseFloat(item.cost_price || 0)), 0);

  if (isLoading) return <LoadingSpinner text={`Loading ${t.entity.toLowerCase()} summary...`} />;

  return (
    <div>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Warehouse className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total {t.plural}</p>
                <p className="text-2xl font-bold">{godowns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalValue, 'SAR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {godowns.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Warehouse className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No {t.plural.toLowerCase()} created yet</p>
            </CardContent>
          </Card>
        ) : (
          godowns.map(godown => (
            <Card key={godown.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5 text-blue-600" />
                  {godown.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span>{godown.address || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Contact:</span>
                    <span>{godown.contact_person || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phone:</span>
                    <span>{godown.phone || '-'}</span>
                  </div>
                  <div className="pt-3 border-t mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Items:</span>
                      <span>{totalItems}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-600">
                      <span>Value:</span>
                      <span>{formatCurrency(totalValue, 'SAR')}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}