import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, subDays } from 'date-fns';
import { Store, Lock, Unlock, History, AlertTriangle, Calculator, Plus, Save, FileSpreadsheet, Printer } from 'lucide-react';
import { formatCurrency } from "@/utils";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import * as XLSX from 'xlsx';

export default function BranchDailyClose() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState("entry");
  const [historyStartDate, setHistoryStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [historyEndDate, setHistoryEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Data State
  const [formData, setFormData] = useState({
    opening_cash: '',
    deposited_by: '',
    cash_received: '',
    cash_sales: '',
    expenses: '',
    drawings: '',
    purchases: '',
    employee_expenses: '',
    bank_transfer: '',
    mada_pos: '',
    online_order_sales: '',
    closing_cash_actual: '',
    notes: ''
  });

  // Fetch Branches
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => rcas.entities.Branch.list()
  });

  const activeBranches = branches.filter(b => b.status !== 'Permanently Closed');

  // Fetch Today's Record
  const { data: dailyRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['branchDailyRecords'],
    queryFn: () => rcas.entities.BranchDailyRecord.list()
  });

  // Fetch Vouchers for calculation (Mock logic for now as we need backend filter)
  const { data: vouchers = [] } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => rcas.entities.Voucher.list()
  });

  // Derived State
  const currentRecord = dailyRecords.find(
    r => r.branch_id === selectedBranchId && r.date === selectedDate
  );

  const previousRecord = dailyRecords
    .filter(r => r.branch_id === selectedBranchId && r.date < selectedDate)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  // Filter for history
  const historyRecords = dailyRecords.filter(r => {
    const rDate = new Date(r.date);
    const start = new Date(historyStartDate);
    const end = new Date(historyEndDate);
    // Include end date in range
    end.setHours(23, 59, 59, 999);
    
    const branchMatch = !selectedBranchId || r.branch_id === selectedBranchId;
    return branchMatch && rDate >= start && rDate <= end;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Auto-select first active branch
  useEffect(() => {
    if (activeBranches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(activeBranches[0].id);
    }
  }, [activeBranches]);

  // Load data into form
  useEffect(() => {
    if (currentRecord) {
      setFormData({
        opening_cash: currentRecord.opening_cash || '',
        deposited_by: currentRecord.deposited_by || '',
        cash_received: currentRecord.cash_received || '',
        cash_sales: currentRecord.cash_sales || '',
        expenses: currentRecord.expenses || '',
        drawings: currentRecord.drawings || '',
        purchases: currentRecord.purchases || '',
        employee_expenses: currentRecord.employee_expenses || '',
        bank_transfer: currentRecord.bank_transfer || '',
        mada_pos: currentRecord.mada_pos || '',
        online_order_sales: currentRecord.online_order_sales || '',
        closing_cash_actual: currentRecord.closing_cash_actual || '',
        notes: currentRecord.notes || ''
      });
    } else if (previousRecord) {
      setFormData(prev => ({
        ...prev,
        opening_cash: previousRecord.closing_cash_actual || ''
      }));
    }
  }, [currentRecord, previousRecord]);

  // Calculate totals from vouchers
  const calculateSystemTotals = () => {
    if (!vouchers.length || !selectedBranchId) return null;

    const dayVouchers = vouchers.filter(v => 
      v.branch_id === selectedBranchId && 
      v.date === selectedDate &&
      v.status !== 'Cancelled'
    );

    const sales = dayVouchers.filter(v => v.voucher_type === 'Sales')
      .reduce((sum, v) => sum + (v.net_amount || 0), 0);
      
    const purchases = dayVouchers.filter(v => v.voucher_type === 'Purchase')
      .reduce((sum, v) => sum + (v.net_amount || 0), 0);
      
    const expenses = dayVouchers.filter(v => v.voucher_type === 'Payment')
      .reduce((sum, v) => sum + (v.net_amount || 0), 0);
      
    const received = dayVouchers.filter(v => v.voucher_type === 'Receipt')
      .reduce((sum, v) => sum + (v.net_amount || 0), 0);

    return { sales, purchases, expenses, received };
  };

  const handleAutoFill = () => {
    const system = calculateSystemTotals();
    if (!system) return toast.error("No vouchers found for this date");

    setFormData(prev => ({
      ...prev,
      // Sum of Sales and Receipts for Cash Received estimate (User can adjust)
      cash_received: system.received || 0,
      cash_sales: system.sales || 0,
      purchases: system.purchases,
      expenses: system.expenses
    }));
    toast.success("Values auto-filled from system vouchers");
  };

  // Calculations
  const calculateTotals = () => {
    const vals = {
      opening: parseFloat(formData.opening_cash) || 0,
      received: parseFloat(formData.cash_received) || 0,
      cash_sales: parseFloat(formData.cash_sales) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      drawings: parseFloat(formData.drawings) || 0,
      purchases: parseFloat(formData.purchases) || 0,
      emp: parseFloat(formData.employee_expenses) || 0,
      bank: parseFloat(formData.bank_transfer) || 0,
      mada: parseFloat(formData.mada_pos) || 0,
      online: parseFloat(formData.online_order_sales) || 0,
      actual: parseFloat(formData.closing_cash_actual) || 0,
    };

    const totalSales = vals.cash_sales + vals.bank + vals.mada + vals.online;
    const totalOutflow = vals.expenses + vals.drawings + vals.purchases + vals.emp;
    const cashToday = vals.opening + vals.received + vals.cash_sales - totalOutflow; // Cash in hand theoretically
    const difference = vals.actual - cashToday;

    return { ...vals, totalSales, totalOutflow, cashToday, difference };
  };

  const totals = calculateTotals();

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        branch_id: selectedBranchId,
        date: selectedDate,
        total_sales: totals.totalSales,
        difference: totals.difference,
        closing_cash_system: totals.cashToday,
        status: data.status || 'Open'
      };

      if (currentRecord) {
        return rcas.entities.BranchDailyRecord.update(currentRecord.id, payload);
      } else {
        return rcas.entities.BranchDailyRecord.create({
          ...payload,
          opened_by: user?.name || 'Unknown'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['branchDailyRecords']);
      toast.success('Record saved successfully');
    }
  });

  const handleSave = (status = 'Open') => {
    if (!selectedBranchId) return toast.error("Select a branch");
    
    saveMutation.mutate({
      opening_cash: parseFloat(formData.opening_cash) || 0,
      deposited_by: formData.deposited_by,
      cash_received: parseFloat(formData.cash_received) || 0,
      cash_sales: parseFloat(formData.cash_sales) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      drawings: parseFloat(formData.drawings) || 0,
      purchases: parseFloat(formData.purchases) || 0,
      employee_expenses: parseFloat(formData.employee_expenses) || 0,
      bank_transfer: parseFloat(formData.bank_transfer) || 0,
      mada_pos: parseFloat(formData.mada_pos) || 0,
      online_order_sales: parseFloat(formData.online_order_sales) || 0,
      closing_cash_actual: parseFloat(formData.closing_cash_actual) || 0,
      notes: formData.notes,
      status
    });
  };

  const handleExportExcel = () => {
    const data = historyRecords.map(r => {
      const branchName = branches.find(b => String(b.id) === String(r.branch_id))?.name || 'Unknown';
      const totalOutflow = (parseFloat(r.expenses || 0) + parseFloat(r.purchases || 0) + parseFloat(r.drawings || 0) + parseFloat(r.employee_expenses || 0));
      return {
        Date: r.date,
        Branch: branchName,
        'Narration': r.deposited_by || '',
        'Opening Cash': r.opening_cash,
        'Deposit Cash': r.cash_received,
        'Cash Sales': r.cash_sales,
        'Total Sales': r.total_sales,
        'Total Outflow': totalOutflow,
        'Closing Cash (System)': r.closing_cash_system,
        'Closing Cash (Actual)': r.closing_cash_actual,
        'Difference': r.difference,
        'Status': r.status,
        'Notes': r.notes
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Records");
    XLSX.writeFile(wb, `Branch_Records_${historyStartDate}_to_${historyEndDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoadingBranches) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="print:hidden">
        <PageHeader 
          title="Branch Daily Entry Table" 
          subtitle="Daily cash flow and sales tracking per branch"
          icon={Store}
          secondaryActions={
            activeTab === 'entry' && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleSave('Open')}>
                  <Save className="mr-2 h-4 w-4" /> Save Draft
                </Button>
                <Button onClick={() => handleSave('Closed')} className="bg-emerald-600 hover:bg-emerald-700">
                  <Lock className="mr-2 h-4 w-4" /> Close Day
                </Button>
              </div>
            )
          }
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="print:hidden">
          <TabsList>
            <TabsTrigger value="entry">Daily Entry</TabsTrigger>
            <TabsTrigger value="history">History & Reports</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="entry" className="space-y-4">
          {/* Controls */}
          <Card className="mb-6 print:hidden">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <FormField 
                  label="Select Branch" 
                  type="select" 
                  value={selectedBranchId} 
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  options={activeBranches.map(b => ({ value: b.id, label: b.name }))}
                  placeholder="Choose a branch..."
                />
                <FormField 
                  label="Date" 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAutoFill} className="w-full">
                    <Calculator className="mr-2 h-4 w-4" /> Auto-fill from System
                  </Button>
                </div>
                <div className="flex items-center pb-2">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${currentRecord?.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    Status: {currentRecord?.status || 'Not Started'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!selectedBranchId ? (
            <div className="text-center py-10 text-slate-500">Please select a branch to continue.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN - INFLOWS */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2 bg-blue-50">
                    <CardTitle className="text-blue-700">Sales & Inflow</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <FormField 
                      label="Deposit Cash" 
                      name="cash_received"
                      type="number" 
                      value={formData.cash_received} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="Cash Today (Cash Sales)" 
                      name="cash_sales"
                      type="number" 
                      value={formData.cash_sales} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="Bank Transfer" 
                      name="bank_transfer"
                      type="number" 
                      value={formData.bank_transfer} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="MADA (POS)" 
                      name="mada_pos"
                      type="number" 
                      value={formData.mada_pos} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="Online Order Sales" 
                      name="online_order_sales"
                      type="number" 
                      value={formData.online_order_sales} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="font-bold text-slate-700">Total Sales</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalSales)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* MIDDLE COLUMN - OUTFLOWS */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2 bg-orange-50">
                    <CardTitle className="text-orange-700">Expenses & Outflow</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <FormField 
                      label="Expenses (General)" 
                      name="expenses"
                      type="number" 
                      value={formData.expenses} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="Drawings (Owner)" 
                      name="drawings"
                      type="number" 
                      value={formData.drawings} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="Purchases (Cash)" 
                      name="purchases"
                      type="number" 
                      value={formData.purchases} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <FormField 
                      label="Emp Expenses (Salary, etc.)" 
                      name="employee_expenses"
                      type="number" 
                      value={formData.employee_expenses} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="font-bold text-slate-700">Total Outflow</span>
                      <span className="text-xl font-bold text-orange-600">{formatCurrency(totals.totalOutflow)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN - RECONCILIATION */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2 bg-slate-50">
                    <CardTitle className="text-slate-700">Cash Reconciliation</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="p-3 bg-slate-100 rounded-lg flex justify-between">
                      <span className="text-sm">Cash Before (Opening)</span>
                      <span className="font-mono font-bold">{formatCurrency(totals.opening)}</span>
                    </div>
                    
                    <FormField 
                      label="Opening Cash (Edit if needed)" 
                      name="opening_cash"
                      type="number" 
                      value={formData.opening_cash} 
                      onChange={handleChange}
                      className="mb-4"
                    />

                    <div className="p-3 bg-blue-50 rounded-lg flex justify-between">
                      <span className="text-sm">Deposit Cash</span>
                      <span className="font-mono font-bold text-blue-600">+{formatCurrency(totals.received)}</span>
                    </div>

                    <div className="p-3 bg-orange-50 rounded-lg flex justify-between">
                      <span className="text-sm">Total Outflow</span>
                      <span className="font-mono font-bold text-orange-600">-{formatCurrency(totals.totalOutflow)}</span>
                    </div>

                    <div className="pt-2 border-t border-dashed">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">System Cash (Calculated)</span>
                        <span className="font-bold text-lg">{formatCurrency(totals.cashToday)}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <FormField 
                        label="Actual Cash Today (Physical)" 
                        name="closing_cash_actual"
                        type="number" 
                        value={formData.closing_cash_actual} 
                        onChange={handleChange}
                        className="bg-emerald-50 border-emerald-200"
                        placeholder="Count your cash..."
                      />
                    </div>

                    {totals.actual > 0 && (
                      <div className={`p-4 rounded-lg flex justify-between items-center ${totals.difference === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        <span className="font-bold">Difference</span>
                        <span className="font-bold text-lg">{formatCurrency(totals.difference)}</span>
                      </div>
                    )}

                    <FormField 
                      label="Notes" 
                      name="notes"
                      type="textarea" 
                      value={formData.notes} 
                      onChange={handleChange}
                      rows={3}
                    />
                  </CardContent>
                </Card>
              </div>

            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="print:hidden">
              <CardTitle>History & Reports</CardTitle>
              <CardDescription>View past daily records, export to Excel, or print.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6 items-end print:hidden">
                <FormField 
                  label="Select Branch" 
                  type="select" 
                  value={selectedBranchId} 
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  options={branches.map(b => ({ value: b.id, label: b.name }))}
                  placeholder="All Branches"
                  className="w-64"
                />
                <FormField 
                  label="From Date" 
                  type="date" 
                  value={historyStartDate} 
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                  className="w-40"
                />
                <FormField 
                  label="To Date" 
                  type="date" 
                  value={historyEndDate} 
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                  className="w-40"
                />
                <div className="flex gap-2 ml-auto">
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Narration</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Total Outflow</TableHead>
                      <TableHead className="text-right">System Cash</TableHead>
                      <TableHead className="text-right">Actual Cash</TableHead>
                      <TableHead className="text-right">Diff</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                          No records found for the selected criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyRecords.map((record) => {
                        const branchName = branches.find(b => String(b.id) === String(record.branch_id))?.name || 'Unknown';
                        const totalOutflow = (parseFloat(record.expenses || 0) + parseFloat(record.purchases || 0) + parseFloat(record.drawings || 0) + parseFloat(record.employee_expenses || 0));
                        return (
                          <TableRow key={record.id}>
                            <TableCell>{record.date}</TableCell>
                            <TableCell>{branchName}</TableCell>
                            <TableCell>{record.deposited_by || '-'}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(record.total_sales || 0)}</TableCell>
                            <TableCell className="text-right text-orange-600">{formatCurrency(totalOutflow)}</TableCell>
                            <TableCell className="text-right text-slate-500">{formatCurrency(record.closing_cash_system || 0)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(record.closing_cash_actual || 0)}</TableCell>
                            <TableCell className={`text-right font-bold ${record.difference < 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(record.difference || 0)}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-600'}`}>
                                {record.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
