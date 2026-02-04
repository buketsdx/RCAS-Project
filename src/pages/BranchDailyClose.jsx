import React, { useState, useEffect, useMemo } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format, subDays } from 'date-fns';
import { Store, Lock, Unlock, History, AlertTriangle, Calculator, Plus, Save, FileSpreadsheet, Printer } from 'lucide-react';
import { formatCurrency } from "@/utils";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
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
  const { type, selectedCompanyId } = useCompany();
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Daily Close Entry',
          subtitle: 'Daily cash flow and service revenue tracking',
          branch: 'Outlet',
          purchases: 'Stock Purchases (Cash)',
          online: 'Online Booking Revenue',
          sales: 'Service Revenue'
        };
      case 'Restaurant':
        return {
          title: 'Daily Close Entry',
          subtitle: 'Daily cash flow and sales tracking',
          branch: 'Outlet',
          purchases: 'Ingredient Purchases (Cash)',
          online: 'Online Order Sales',
          sales: 'Sales'
        };
      default:
        return {
          title: 'Branch Daily Entry Table',
          subtitle: 'Daily cash flow and sales tracking per branch',
          branch: 'Branch',
          purchases: 'Purchases (Cash)',
          online: 'Online Order Sales',
          sales: 'Sales'
        };
    }
  };

  const t = getTerminology();
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
    queryKey: ['branches', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Branch.list();
      return list.filter(b => String(b.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Reset selected branch when company changes
  useEffect(() => {
    setSelectedBranchId('');
  }, [selectedCompanyId]);

  const activeBranches = useMemo(() => 
    branches.filter(b => b.status !== 'Permanently Closed'),
    [branches]
  );

  // Fetch Today's Record
  const { data: rawDailyRecords = [], isLoading: isLoadingRecords } = useQuery({
    queryKey: ['branchDailyRecords', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.BranchDailyRecord.list();
      // Filter records by branches that belong to the selected company
      const companyBranches = await rcas.entities.Branch.list();
      const companyBranchIds = new Set(
        companyBranches
          .filter(b => String(b.company_id) === String(selectedCompanyId))
          .map(b => b.id)
      );
      return list.filter(r => companyBranchIds.has(r.branch_id));
    },
    enabled: !!selectedCompanyId
  });

  const dailyRecords = useMemo(() => {
    if (!branches.length) return [];
    const branchIds = branches.map(b => String(b.id));
    return rawDailyRecords.filter(r => branchIds.includes(String(r.branch_id)));
  }, [rawDailyRecords, branches]);

  // Fetch Vouchers for calculation (Mock logic for now as we need backend filter)
  const { data: vouchers = [] } = useQuery({
    queryKey: ['vouchers', selectedCompanyId],
    queryFn: async () => {
       const list = await rcas.entities.Voucher.list();
       // Filter vouchers by company branches
       return list.filter(v => v.company_id === selectedCompanyId || String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Fetch Employees & Voucher Items for Commission Calculation
  const { data: employees = [] } = useQuery({
    queryKey: ['employees', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Employee.list();
      return list.filter(e => String(e.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  
  const { data: voucherItems = [] } = useQuery({
    queryKey: ['voucherItems', selectedCompanyId],
    queryFn: () => rcas.entities.VoucherItem.list()
  });

  const activeEmployees = employees.filter(e => e.is_active !== false);

  // Fetch Stylist Entries (New - for Salon)
  const { data: savedStylistEntries = [] } = useQuery({
    queryKey: ['stylistEntries', selectedCompanyId, selectedBranchId, selectedDate],
    queryFn: async () => {
      if (!selectedBranchId) return [];
      const list = await rcas.entities.StylistServiceEntry.list();
      return list.filter(e => 
        e.branch_id === selectedBranchId && 
        e.date === selectedDate
      );
    },
    enabled: !!selectedBranchId && !!selectedDate && type === 'Salon'
  });

  // Local state for stylist services
  const [stylistServices, setStylistServices] = useState([]);

  // Sync state with fetched data
  useEffect(() => {
    if (savedStylistEntries.length > 0) {
      setStylistServices(prev => {
        // Prevent infinite loop by checking deep equality
        const isSame = prev.length === savedStylistEntries.length && 
          prev.every((p, i) => 
            p.stylist_id === savedStylistEntries[i].stylist_id && 
            p.service_count === savedStylistEntries[i].service_count
          );
        return isSame ? prev : savedStylistEntries;
      });
    } else {
      setStylistServices(prev => prev.length === 0 ? prev : []);
    }
  }, [savedStylistEntries, selectedDate, selectedBranchId]);

  // Stylist Entry Handlers
  const [newStylistEntry, setNewStylistEntry] = useState({ stylist_id: '', service_count: '' });
  const [deletedStylistEntryIds, setDeletedStylistEntryIds] = useState([]);

  const handleAddStylistEntry = () => {
    if (!newStylistEntry.stylist_id || !newStylistEntry.service_count) return;
    setStylistServices(prev => [...prev, { ...newStylistEntry, id: `temp-${Date.now()}` }]);
    setNewStylistEntry({ stylist_id: '', service_count: '' });
  };

  const handleRemoveStylistEntry = (index) => {
    const entry = stylistServices[index];
    if (entry.id && !entry.id.toString().startsWith('temp')) {
       setDeletedStylistEntryIds(prev => [...prev, entry.id]);
    }
    setStylistServices(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate Daily Commissions
  const dailyCommissions = useMemo(() => {
    if (!selectedBranchId) return [];

    // For Salon: Use Manual Entry Table
    if (type === 'Salon') {
       return stylistServices.map(entry => {
         const emp = activeEmployees.find(e => String(e.id) === String(entry.stylist_id));
         if (!emp) return null;
         
         const count = parseFloat(entry.service_count) || 0;
         const isPro = emp.is_dual_commission_eligible === true || String(emp.is_dual_commission_eligible) === 'true';
         const amount = count * 1; // 1 SAR per service rule

         return {
           id: emp.id,
           name: emp.name,
           type: isPro ? 'Pro' : 'Normal',
           serviceCount: count,
           commissionAmount: amount,
           isPayableToday: !isPro
         };
       }).filter(Boolean);
    }

    if (!vouchers.length) return [];

    const daySalesVouchers = vouchers.filter(v => 
      v.branch_id === selectedBranchId && 
      v.date === selectedDate && 
      v.voucher_type === 'Sales' &&
      v.status !== 'Cancelled'
    );
    
    const dayVoucherIds = daySalesVouchers.map(v => v.id);
    
    return activeEmployees.map(emp => {
      // Filter items for this employee (check both string and number ID match)
      const empItems = voucherItems.filter(item => 
        dayVoucherIds.includes(item.voucher_id) && 
        (String(item.salesman_id) === String(emp.id))
      );
      
      const count = empItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      const isPro = emp.is_dual_commission_eligible === true || String(emp.is_dual_commission_eligible) === 'true';
      
      // Commission rule: 1 SAR per service for Normal staff
      const amount = count * 1;

      return {
        id: emp.id,
        name: emp.name,
        type: isPro ? 'Pro' : 'Normal',
        serviceCount: count,
        commissionAmount: amount,
        isPayableToday: !isPro // Only Normal staff get daily payment
      };
    }).filter(item => item.serviceCount > 0);
  }, [vouchers, voucherItems, activeEmployees, selectedBranchId, selectedDate, stylistServices, type]);

  const totalPayableCommission = dailyCommissions
    .filter(c => c.isPayableToday)
    .reduce((sum, c) => sum + c.commissionAmount, 0);

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

  // Auto-select first active branch or validate current selection
  useEffect(() => {
    if (activeBranches.length > 0) {
      const isValid = activeBranches.find(b => b.id === selectedBranchId);
      if (!selectedBranchId || !isValid) {
        setSelectedBranchId(activeBranches[0].id);
      }
    } else {
      setSelectedBranchId('');
    }
  }, [activeBranches, selectedBranchId]);

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

  const handleSave = async (status = 'Open') => {
    if (!selectedBranchId) return toast.error("Select a branch");
    
    // Save Stylist Entries if Salon
    if (type === 'Salon') {
       // Delete removed entries
       for (const id of deletedStylistEntryIds) {
          await rcas.entities.StylistServiceEntry.delete(id);
       }
       setDeletedStylistEntryIds([]);

       // Update/Create entries
       if (stylistServices.length > 0) {
         for (const entry of stylistServices) {
           const payload = { 
              service_count: entry.service_count,
              branch_id: selectedBranchId, 
              date: selectedDate, 
              company_id: selectedCompanyId,
              stylist_id: entry.stylist_id
           };

           if (entry.id && !entry.id.toString().startsWith('temp')) {
              await rcas.entities.StylistServiceEntry.update(entry.id, payload);
           } else {
              await rcas.entities.StylistServiceEntry.create(payload);
           }
         }
         // Refresh query
         queryClient.invalidateQueries(['stylistEntries']);
       }
    }

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
          title={t.title}
          subtitle={t.subtitle}
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
                  key={`branch-select-${selectedCompanyId}`}
                  label={`Select ${t.branch}`} 
                  type="select" 
                  value={selectedBranchId} 
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  options={activeBranches.map(b => ({ value: b.id, label: b.name }))}
                  placeholder={`Choose a ${t.branch.toLowerCase()}...`}
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
            <div className="text-center py-10 text-slate-500">Please select a {t.branch.toLowerCase()} to continue.</div>
          ) : (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN - INFLOWS */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-2 bg-blue-50">
                    <CardTitle className="text-blue-700">{t.sales} & Inflow</CardTitle>
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
                      label={`Cash Today (Cash ${t.sales})`}
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
                      label={t.online}
                      name="online_order_sales"
                      type="number" 
                      value={formData.online_order_sales} 
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="font-bold text-slate-700">Total {t.sales}</span>
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
                      label={t.purchases}
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

            {/* COMMISSION PAYMENT DETAILS SECTION */}
            <Card className="mt-6">
              <CardHeader className="pb-2 bg-purple-50">
                <CardTitle className="text-purple-700 flex justify-between items-center">
                  <span>{type === 'Salon' ? 'Stylist Service Performance' : 'Daily Commission & Staff Payments'}</span>
                  <span className="text-sm font-normal text-purple-600">Total Payable: {formatCurrency(totalPayableCommission)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {type === 'Salon' ? (
                  <div className="space-y-4">
                     <div className="flex gap-2 items-end p-4 bg-slate-50 rounded-lg border">
                        <FormField 
                           label="Select Stylist"
                           type="select"
                           options={activeEmployees.map(e => ({ value: e.id, label: e.name }))}
                           value={newStylistEntry.stylist_id}
                           onChange={(e) => setNewStylistEntry(prev => ({ ...prev, stylist_id: e.target.value }))}
                           className="flex-1"
                           placeholder="Choose Stylist..."
                        />
                        <FormField 
                           label="Haircuts / Services"
                           type="number"
                           value={newStylistEntry.service_count}
                           onChange={(e) => setNewStylistEntry(prev => ({ ...prev, service_count: e.target.value }))}
                           className="w-40"
                           placeholder="0"
                        />
                        <Button onClick={handleAddStylistEntry} className="mb-1 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" /> Add</Button>
                     </div>

                     <Table>
                        <TableHeader>
                           <TableRow>
                              <TableHead>Stylist Name</TableHead>
                              <TableHead className="text-right">Services</TableHead>
                              <TableHead className="text-right">Commission (SAR)</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {stylistServices.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={4} className="text-center text-slate-500">No services entered yet.</TableCell>
                              </TableRow>
                           ) : (
                              stylistServices.map((entry, index) => {
                                 const emp = activeEmployees.find(e => String(e.id) === String(entry.stylist_id));
                                 const count = parseFloat(entry.service_count) || 0;
                                 return (
                                    <TableRow key={index}>
                                       <TableCell className="font-medium">{emp?.name || 'Unknown'}</TableCell>
                                       <TableCell className="text-right">{count}</TableCell>
                                       <TableCell className="text-right">{formatCurrency(count * 1)}</TableCell>
                                       <TableCell className="text-right">
                                          <Button variant="ghost" size="sm" onClick={() => handleRemoveStylistEntry(index)}>
                                             <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                       </TableCell>
                                    </TableRow>
                                 );
                              })
                           )}
                        </TableBody>
                     </Table>
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Services</TableHead>
                      <TableHead className="text-right">Commission (SAR)</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyCommissions.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={5} className="text-center text-slate-500">No staff activity recorded for today</TableCell>
                       </TableRow>
                    ) : (
                       dailyCommissions.map(staff => (
                         <TableRow key={staff.id}>
                           <TableCell className="font-medium">{staff.name}</TableCell>
                           <TableCell>
                             <Badge variant={staff.type === 'Pro' ? 'default' : 'secondary'}>
                               {staff.type}
                             </Badge>
                           </TableCell>
                           <TableCell className="text-right">{staff.serviceCount}</TableCell>
                           <TableCell className="text-right font-bold">{formatCurrency(staff.commissionAmount)}</TableCell>
                           <TableCell className="text-right">
                             {staff.isPayableToday ? (
                               <span className="text-emerald-600 font-medium">Payable Today</span>
                             ) : (
                               <span className="text-slate-500">Monthly Accrual</span>
                             )}
                           </TableCell>
                         </TableRow>
                       ))
                    )}
                  </TableBody>
                </Table>
                )}
                
                {totalPayableCommission > 0 && (
                  <div className="mt-4 p-3 bg-purple-100 rounded-md flex items-center justify-between">
                    <span className="text-purple-800 text-sm">
                      <strong>Tip:</strong> Add <strong>{formatCurrency(totalPayableCommission)}</strong> to "Emp Expenses" if paying cash today.
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="bg-white border-purple-200 hover:bg-purple-50 text-purple-700"
                      onClick={() => setFormData(prev => ({ ...prev, employee_expenses: (parseFloat(prev.employee_expenses) || 0) + totalPayableCommission }))}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add to Expenses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </>
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
