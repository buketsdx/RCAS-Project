import React, { useState, useMemo } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, ArrowUpDown, TrendingUp, TrendingDown, Package, History } from 'lucide-react';
import { formatCurrency, formatDate, exportToCSV } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCompany } from '@/context/CompanyContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeDialog, AdWatchDialog } from '@/components/monetization/MonetizationComponents';
import { Lock, Download } from 'lucide-react';

export default function SupplierComparison() {
  const { selectedCompanyId } = useCompany();
  const { isPremium, hasAdAccess, unlockWithAd } = useFeatureAccess('supplier_comparison');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [adWatchOpen, setAdWatchOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);

  const MAX_FREE_ITEMS = 3;

  // Fetch Suppliers
  const { data: ledgers = [], isLoading: isLoadingLedgers } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Fetch Transactions and Vouchers
  const { data: vouchers = [], isLoading: isLoadingVouchers } = useQuery({
    queryKey: ['vouchers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: voucherItems = [], isLoading: isLoadingVoucherItems } = useQuery({
    queryKey: ['voucherItems', selectedCompanyId],
    queryFn: async () => {
      const allItems = await rcas.entities.VoucherItem.list();
      const companyVouchers = await rcas.entities.Voucher.list();
      const companyVoucherIds = companyVouchers
        .filter(v => String(v.company_id) === String(selectedCompanyId))
        .map(v => v.id);
      return allItems.filter(item => companyVoucherIds.includes(item.voucher_id));
    },
    enabled: !!selectedCompanyId
  });

  const { data: stockItems = [], isLoading: isLoadingStockItems } = useQuery({
    queryKey: ['stockItems', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.StockItem.list();
      return list.filter(s => String(s.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Filter for Suppliers
  const suppliers = useMemo(() => {
    return ledgers.filter(l => l.customer_type === 'VAT Customer' || l.customer_type === 'General');
  }, [ledgers]);

  // Overview Metrics
  const supplierMetrics = useMemo(() => {
    if (!suppliers.length) return [];
    return suppliers.map(supplier => {
      const totalPurchases = Math.random() * 50000; // Mock until real linking
      const outstanding = parseFloat(supplier.opening_balance || 0); 
      const transactionCount = Math.floor(Math.random() * 20); 
      return {
        ...supplier,
        total_purchases: totalPurchases,
        outstanding: outstanding,
        transaction_count: transactionCount,
        rating: (Math.random() * 2 + 3).toFixed(1)
      };
    }).sort((a, b) => b.total_purchases - a.total_purchases);
  }, [suppliers]);

  // Rate Comparison Data Processing
  const itemRateAnalysis = useMemo(() => {
    if (!vouchers.length || !voucherItems.length || !stockItems.length) return [];

    // Filter Purchase Vouchers
    const purchaseVouchers = vouchers.filter(v => v.voucher_type === 'Purchase');
    const purchaseVoucherIds = new Set(purchaseVouchers.map(v => v.id));

    // Group Items by Stock ID
    const itemMap = {};

    voucherItems.forEach(item => {
      if (purchaseVoucherIds.has(item.voucher_id) && item.stock_item_id) {
        if (!itemMap[item.stock_item_id]) {
          const stockItem = stockItems.find(si => si.id === item.stock_item_id);
          itemMap[item.stock_item_id] = {
            id: item.stock_item_id,
            name: stockItem?.name || item.stock_item_name || 'Unknown Item',
            purchases: []
          };
        }

        const voucher = purchaseVouchers.find(v => v.id === item.voucher_id);
        if (voucher) {
          itemMap[item.stock_item_id].purchases.push({
            supplierId: voucher.party_ledger_id,
            supplierName: voucher.party_name || 'Unknown Supplier',
            date: voucher.date,
            rate: parseFloat(item.rate) || 0,
            quantity: parseFloat(item.quantity) || 0,
            voucherNumber: voucher.voucher_number
          });
        }
      }
    });

    // Calculate Statistics per Item
    return Object.values(itemMap).map(item => {
      const rates = item.purchases.map(p => p.rate);
      const minRate = Math.min(...rates);
      const maxRate = Math.max(...rates);
      const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      
      // Find Best Supplier (Lowest Rate)
      const bestPurchase = item.purchases.reduce((prev, curr) => curr.rate < prev.rate ? curr : prev, item.purchases[0]);

      return {
        ...item,
        minRate,
        maxRate,
        avgRate,
        purchaseCount: item.purchases.length,
        bestSupplier: bestPurchase?.supplierName,
        bestRate: bestPurchase?.rate,
        lastPurchaseDate: item.purchases.sort((a,b) => new Date(b.date) - new Date(a.date))[0]?.date
      };
    });
  }, [vouchers, voucherItems, stockItems]);
  
  const handleViewHistory = (item) => {
    if (!isPremium) {
      if (hasAdAccess('supplier_comparison_view_history')) {
        setSelectedItem(item);
        setDialogOpen(true);
        return;
      }
      setPendingItem(item);
      setAdWatchOpen(true);
      return;
    }
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleAdComplete = () => {
    unlockWithAd('supplier_comparison_view_history');
    setAdWatchOpen(false);
    if (pendingItem) {
      setSelectedItem(pendingItem);
      setDialogOpen(true);
    }
    setPendingItem(null);
  };

  const handleExport = () => {
    if (!isPremium) {
      setUpgradeOpen(true);
      return;
    }
    
    if (activeTab === 'overview') {
      const data = supplierMetrics.map(s => ({
        Supplier: s.name,
        Type: s.customer_type,
        'Total Purchases': s.total_purchases,
        'Outstanding': s.outstanding,
        'Transactions': s.transaction_count,
        'Rating': s.rating
      }));
      exportToCSV(data, 'supplier_performance.csv');
    } else {
      const data = itemRateAnalysis.map(i => ({
        Item: i.name,
        'Purchase Count': i.purchaseCount,
        'Min Rate': i.minRate,
        'Max Rate': i.maxRate,
        'Avg Rate': i.avgRate,
        'Best Supplier': i.bestSupplier,
        'Last Purchase': i.lastPurchaseDate
      }));
      exportToCSV(data, 'item_rate_analysis.csv');
    }
  };

  const overviewColumns = [
    { 
      header: 'Supplier Name', 
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-medium">{row.name}</div>
          <div className="text-xs text-slate-500">{row.customer_type}</div>
        </div>
      )
    },
    { header: 'Total Purchases', accessor: 'total_purchases', render: (row) => formatCurrency(row.total_purchases) },
    { 
      header: 'Outstanding Balance', 
      accessor: 'outstanding',
      render: (row) => (
        <span className={row.outstanding > 0 ? "text-red-600 font-medium" : "text-slate-600"}>
          {formatCurrency(row.outstanding)}
        </span>
      )
    },
    { header: 'Transactions', accessor: 'transaction_count', className: 'text-center' },
    { 
      header: 'Performance Rating', 
      accessor: 'rating',
      render: (row) => (
        <div className="flex items-center gap-1">
          <span className={`font-bold ${row.rating >= 4.5 ? 'text-emerald-600' : row.rating >= 4.0 ? 'text-blue-600' : 'text-amber-600'}`}>
            {row.rating}
          </span>
          <span className="text-xs text-slate-400">/ 5.0</span>
        </div>
      )
    }
  ];

  const rateColumns = [
    { header: 'Item Name', accessor: 'name', className: 'font-medium' },
    { header: 'Purchase Count', accessor: 'purchaseCount', className: 'text-center' },
    { header: 'Lowest Rate', accessor: 'minRate', render: (row) => <span className="text-emerald-600 font-bold">{formatCurrency(row.minRate)}</span> },
    { header: 'Highest Rate', accessor: 'maxRate', render: (row) => formatCurrency(row.maxRate) },
    { header: 'Best Supplier', accessor: 'bestSupplier', render: (row) => <span className="text-sm">{row.bestSupplier}</span> },
    { 
      header: 'Actions', 
      render: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewHistory(row)}>
          View History
        </Button>
      )
    }
  ];

  const visibleSupplierMetrics = isPremium ? supplierMetrics : supplierMetrics.slice(0, MAX_FREE_ITEMS);
  const visibleItemRates = isPremium ? itemRateAnalysis : itemRateAnalysis.slice(0, MAX_FREE_ITEMS);

  if (isLoadingLedgers || isLoadingVouchers || isLoadingVoucherItems || isLoadingStockItems) {
    return <LoadingSpinner text="Loading comparison data..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Supplier Comparison" 
        subtitle="Compare supplier performance and item rates"
        icon={BarChart3}
        secondaryActions={
          <Button variant="outline" onClick={handleExport} className="gap-2">
            {!isPremium ? <Lock className="h-4 w-4 text-amber-500" /> : <Download className="h-4 w-4" />}
            Export Report
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Performance Overview</TabsTrigger>
          <TabsTrigger value="rates">Rate Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Top Supplier (Volume)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {supplierMetrics[0]?.name || '-'}
                </div>
                <p className="text-xs text-emerald-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Highest purchase volume
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Most Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {supplierMetrics.sort((a,b) => b.outstanding - a.outstanding)[0]?.name || '-'}
                </div>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  Highest pending payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">Total Suppliers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">{suppliers.length}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    {suppliers.filter(s => s.customer_type === 'VAT Customer').length} VAT
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {suppliers.filter(s => s.customer_type !== 'VAT Customer').length} General
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Performance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={overviewColumns} 
                data={visibleSupplierMetrics}
                searchable
                searchKey="name"
              />
              {!isPremium && supplierMetrics.length > MAX_FREE_ITEMS && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-center mt-2">
                  <Lock className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 font-medium mb-2">
                    Showing {MAX_FREE_ITEMS} of {supplierMetrics.length} suppliers. Upgrade to Premium to compare all.
                  </p>
                  <Button onClick={() => setUpgradeOpen(true)} variant="default" size="sm" className="bg-amber-500 hover:bg-amber-600">
                    Upgrade Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle>Item Rate Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {itemRateAnalysis.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                  <p>No purchase history available for comparison.</p>
                </div>
              ) : (
                <>
                  <DataTable 
                    columns={rateColumns} 
                    data={visibleItemRates}
                    searchable
                    searchKey="name"
                  />
                  {!isPremium && itemRateAnalysis.length > MAX_FREE_ITEMS && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center text-center mt-2">
                      <Lock className="h-8 w-8 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600 font-medium mb-2">
                        Showing {MAX_FREE_ITEMS} of {itemRateAnalysis.length} items. Upgrade to Premium to see all rates.
                      </p>
                      <Button onClick={() => setUpgradeOpen(true)} variant="default" size="sm" className="bg-amber-500 hover:bg-amber-600">
                        Upgrade Now
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate History: {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Supplier</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2">Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedItem?.purchases?.sort((a,b) => new Date(b.date) - new Date(a.date)).map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-2">{formatDate(p.date)}</td>
                      <td className="px-4 py-2 font-medium">{p.supplierName}</td>
                      <td className="px-4 py-2 text-right font-bold text-slate-700">{formatCurrency(p.rate)}</td>
                      <td className="px-4 py-2 text-right">{p.quantity}</td>
                      <td className="px-4 py-2 text-xs text-slate-500">{p.voucherNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <AdWatchDialog 
        open={adWatchOpen} 
        onOpenChange={setAdWatchOpen}
        onComplete={handleAdComplete}
        title="Unlock Detailed History"
        description="Watch a short ad to view detailed rate history for this item."
      />
    </div>
  );
}
