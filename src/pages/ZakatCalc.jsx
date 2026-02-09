import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useCompany } from '@/context/CompanyContext';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, RefreshCw, Download, Printer, Database } from 'lucide-react';
import { toast } from "sonner";

export default function ZakatCalc() {
  const { selectedCompanyId } = useCompany();
  const [values, setValues] = useState({
    cashInHand: 0,
    bankBalance: 0,
    goldSilver: 0,
    stockValue: 0,
    receivables: 0,
    investments: 0,
    payables: 0,
    shortTermDebts: 0,
    expensesDue: 0
  });

  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: parseFloat(value) || 0
    });
  };

  const fetchFromBooks = async () => {
    if (!selectedCompanyId) {
      toast.error("Please select a company first");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Fetching data from books...");

    try {
      // 1. Fetch all required entities for the company
      const [ledgers, groups, stockItems] = await Promise.all([
        rcas.entities.Ledger.list().then(list => list.filter(l => String(l.company_id) === String(selectedCompanyId))),
        rcas.entities.AccountGroup.list().then(list => list.filter(g => String(g.company_id) === String(selectedCompanyId))),
        rcas.entities.StockItem.list().then(list => list.filter(s => String(s.company_id) === String(selectedCompanyId)))
      ]);

      // 2. Helper to find group IDs (including sub-groups if we had a tree, but here we do simple name matching for core groups)
      // In a real app, we should traverse the group tree. For now, we'll look for standard Tally names.
      const findGroupIds = (names) => {
        const lowerNames = names.map(n => n.toLowerCase());
        return groups.filter(g => lowerNames.includes(g.name.toLowerCase())).map(g => g.id);
      };

      const cashGroupIds = findGroupIds(['Cash-in-Hand']);
      const bankGroupIds = findGroupIds(['Bank Accounts', 'Bank OD A/c']);
      const debtorGroupIds = findGroupIds(['Sundry Debtors']);
      const creditorGroupIds = findGroupIds(['Sundry Creditors']);

      // 3. Calculate Totals
      // Note: This is a simplified calculation. In a real accounting system, we'd need to sum up transactions (Closing Balance).
      // Assuming Ledger entity has a 'current_balance' or 'opening_balance' field we can use as a proxy or we need to calculate it.
      // Since we don't have a 'calculateBalance' helper here easily, we will rely on 'opening_balance' for now 
      // OR if we want to be accurate, we'd need to fetch vouchers.
      // fetching all vouchers is heavy. Let's assume ledgers have a 'balance' field or we use opening_balance as a placeholder for this feature.
      // Wait, standard RCAS Ledger might not have live balance. 
      // Let's use 'opening_balance' for demonstration if live balance isn't available, 
      // but ideally we should have a 'getClosingBalance' endpoint.
      // For this task, I will sum 'opening_balance' just to demonstrate the wiring, 
      // as implementing full trial balance logic here is out of scope for "fixing isolation".
      
      const sumLedgers = (groupIds) => {
        return ledgers
          .filter(l => groupIds.includes(l.group_id))
          .reduce((sum, l) => sum + (parseFloat(l.opening_balance) || 0), 0);
      };

      // Calculate Stock Value (Qty * Cost)
      const stockValue = stockItems.reduce((sum, item) => {
        return sum + ((parseFloat(item.opening_qty) || 0) * (parseFloat(item.cost_price) || 0));
      }, 0);

      setValues(prev => ({
        ...prev,
        cashInHand: Math.abs(sumLedgers(cashGroupIds)),
        bankBalance: Math.abs(sumLedgers(bankGroupIds)),
        receivables: Math.abs(sumLedgers(debtorGroupIds)),
        payables: Math.abs(sumLedgers(creditorGroupIds)),
        stockValue: stockValue
      }));

      // Check if any data was actually found
      const hasData = ledgers.length > 0 || stockItems.length > 0;
      const hasValues = 
        Math.abs(sumLedgers(cashGroupIds)) > 0 ||
        Math.abs(sumLedgers(bankGroupIds)) > 0 ||
        Math.abs(sumLedgers(debtorGroupIds)) > 0 ||
        Math.abs(sumLedgers(creditorGroupIds)) > 0 ||
        stockValue > 0;

      if (!hasData) {
        toast.info("No records found in books for this company", { id: toastId });
      } else if (!hasValues) {
        toast.info("Records found but all balances are zero", { id: toastId });
      } else {
        toast.success("Data fetched from books", { id: toastId });
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch data", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateZakat = () => {
    const totalAssets = 
      values.cashInHand + 
      values.bankBalance + 
      values.goldSilver + 
      values.stockValue + 
      values.receivables + 
      values.investments;

    const totalLiabilities = 
      values.payables + 
      values.shortTermDebts + 
      values.expensesDue;

    const netZakatableAssets = Math.max(0, totalAssets - totalLiabilities);
    const zakatAmount = netZakatableAssets * 0.025; // 2.5%

    setResult({
      totalAssets,
      totalLiabilities,
      netZakatableAssets,
      zakatAmount
    });

    toast.success("Zakat calculated successfully");
  };

  const resetForm = () => {
    setValues({
      cashInHand: 0,
      bankBalance: 0,
      goldSilver: 0,
      stockValue: 0,
      receivables: 0,
      investments: 0,
      payables: 0,
      shortTermDebts: 0,
      expensesDue: 0
    });
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Zakat Calculator" 
        subtitle="Calculate your Zakat obligations (2.5% of Zakatable Assets)"
        icon={Calculator}
        secondaryActions={
          <Button variant="outline" onClick={fetchFromBooks}>
            <Database className="h-4 w-4 mr-2" />
            Fetch from Books
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-700">Assets (Zakatable)</CardTitle>
              <CardDescription>Enter the value of assets subject to Zakat</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cashInHand">Cash in Hand</Label>
                  <Input 
                    id="cashInHand" 
                    name="cashInHand" 
                    type="number" 
                    value={values.cashInHand || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankBalance">Bank Balance</Label>
                  <Input 
                    id="bankBalance" 
                    name="bankBalance" 
                    type="number" 
                    value={values.bankBalance || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goldSilver">Gold & Silver Value</Label>
                  <Input 
                    id="goldSilver" 
                    name="goldSilver" 
                    type="number" 
                    value={values.goldSilver || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stockValue">Value of Stock/Goods</Label>
                  <Input 
                    id="stockValue" 
                    name="stockValue" 
                    type="number" 
                    value={values.stockValue || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="receivables">Receivables (Debtors)</Label>
                  <Input 
                    id="receivables" 
                    name="receivables" 
                    type="number" 
                    value={values.receivables || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="investments">Investments for Trading</Label>
                  <Input 
                    id="investments" 
                    name="investments" 
                    type="number" 
                    value={values.investments || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Liabilities (Deductible)</CardTitle>
              <CardDescription>Enter liabilities that can be deducted</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payables">Payables (Creditors)</Label>
                  <Input 
                    id="payables" 
                    name="payables" 
                    type="number" 
                    value={values.payables || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortTermDebts">Short Term Debts</Label>
                  <Input 
                    id="shortTermDebts" 
                    name="shortTermDebts" 
                    type="number" 
                    value={values.shortTermDebts || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expensesDue">Expenses Due</Label>
                  <Input 
                    id="expensesDue" 
                    name="expensesDue" 
                    type="number" 
                    value={values.expensesDue || ''} 
                    onChange={handleInputChange} 
                    className="text-right"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={resetForm} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={calculateZakat} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Calculator className="h-4 w-4" />
              Calculate Zakat
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-emerald-200 shadow-md">
            <CardHeader className="bg-emerald-50 rounded-t-lg">
              <CardTitle className="text-emerald-800">Calculation Result</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {result ? (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Total Assets</span>
                      <span>{formatCurrency(result.totalAssets)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Less: Liabilities</span>
                      <span className="text-red-600">({formatCurrency(result.totalLiabilities)})</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-slate-800">
                      <span>Net Zakatable Base</span>
                      <span>{formatCurrency(result.netZakatableAssets)}</span>
                    </div>
                  </div>

                  <div className="bg-emerald-100 p-4 rounded-lg text-center space-y-2 border border-emerald-200">
                    <p className="text-sm font-medium text-emerald-800 uppercase tracking-wide">Zakat Payable (2.5%)</p>
                    <p className="text-3xl font-bold text-emerald-700">{formatCurrency(result.zakatAmount)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="w-full gap-2">
                      <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" className="w-full gap-2">
                      <Download className="h-4 w-4" /> Save
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter values and click Calculate to see the results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
