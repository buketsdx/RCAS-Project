import React, { useState } from 'react';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calculator, RefreshCw, Download, Printer } from 'lucide-react';
import { toast } from "sonner";

export default function ZakatCalc() {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: parseFloat(value) || 0
    });
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
