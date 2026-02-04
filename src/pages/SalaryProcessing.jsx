import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import { formatCurrency, generateVoucherCode } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Banknote, Calculator, CheckCircle } from 'lucide-react';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function SalaryProcessing() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({ 
    queryKey: ['employees', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Employee.list();
      return list.filter(e => String(e.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  
  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery({ 
    queryKey: ['payrolls', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Payroll.list();
      return list.filter(p => String(p.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  
  const { data: vouchers = [] } = useQuery({ 
    queryKey: ['vouchers', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.filter(v => String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });
  
  const { data: voucherItems = [] } = useQuery({ 
    queryKey: ['voucherItems', selectedCompanyId], 
    queryFn: async () => {
      const allItems = await rcas.entities.VoucherItem.list();
      // Optimization: we could filter by company vouchers here if needed
      // But for now, we rely on memory filtering for calculations, 
      // but to avoid data leakage in cache, we should filter by company vouchers
      const companyVouchers = await rcas.entities.Voucher.list();
      const companyVoucherIds = companyVouchers
        .filter(v => String(v.company_id) === String(selectedCompanyId))
        .map(v => v.id);
      return allItems.filter(item => companyVoucherIds.includes(item.voucher_id));
    },
    enabled: !!selectedCompanyId
  });

  const activeEmployees = employees.filter(e => e.is_active !== false);
  const monthPayrolls = payrolls.filter(p => p.month === selectedMonth && p.year === selectedYear);

  const processMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const emp of activeEmployees) {
        const existing = monthPayrolls.find(p => p.employee_id === emp.id);
        if (existing) continue;

        const basic = parseFloat(emp.basic_salary) || 0;
        const housing = parseFloat(emp.housing_allowance) || 0;
        const transport = parseFloat(emp.transport_allowance) || 0;
        const other = parseFloat(emp.other_allowances) || 0;

        // Calculate Commission
        const monthIndex = months.indexOf(selectedMonth);
        
        // Check eligibility (handle boolean or string 'true')
        const isEligible = emp.is_dual_commission_eligible === true || emp.is_dual_commission_eligible === 'true';

        let dateStart, dateEnd;

        if (isEligible) {
          // Dual Commission Cycle: 16th of previous month to 15th of current month
          dateStart = new Date(selectedYear, monthIndex - 1, 16);
          dateEnd = new Date(selectedYear, monthIndex, 15);
        } else {
          // Normal Commission Cycle: 1st to End of current month
          dateStart = new Date(selectedYear, monthIndex, 1);
          dateEnd = new Date(selectedYear, monthIndex + 1, 0);
        }
        
        const relevantVouchers = vouchers.filter(v => {
           const vDate = new Date(v.date);
           return vDate >= dateStart && vDate <= dateEnd && v.voucher_type === 'Sales';
        });
        const relevantVoucherIds = relevantVouchers.map(v => v.id);
        
        const empItems = voucherItems.filter(item => 
          relevantVoucherIds.includes(item.voucher_id) && item.salesman_id === emp.id
        );
        
        const haircutCount = empItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
        
        let commission = 0;
        
        if (isEligible) {
          if (haircutCount > 500) {
            commission = 500 * 1 + (haircutCount - 500) * 2;
          } else {
            commission = haircutCount * 1;
          }
        } else {
          commission = haircutCount * 1;
        }

        const gross = basic + housing + transport + other + commission;
        
        const gosiEmployee = basic * 0.0975; // 9.75% employee contribution
        const gosiEmployer = basic * 0.1175; // 11.75% employer contribution
        const totalDeductions = gosiEmployee;
        const netSalary = gross - totalDeductions;

        // Auto-generate payroll code
        const payrollCode = await generateVoucherCode('Payroll');

        const payrollData = {
          payroll_code: payrollCode,
          employee_id: emp.id,
          employee_name: emp.name,
          month: selectedMonth,
          year: selectedYear,
          working_days: 30,
          present_days: 30,
          basic_salary: basic,
          housing_allowance: housing,
          transport_allowance: transport,
          other_allowances: other,
          commission_amount: commission,
          gross_salary: gross,
          gosi_employee: gosiEmployee,
          gosi_employer: gosiEmployer,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          status: 'Processed',
          company_id: selectedCompanyId
        };

        results.push(await rcas.entities.Payroll.create(payrollData));
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['payrolls', selectedCompanyId] });
      toast.success(`Processed salary for ${results.length} employees`);
    }
  });

  const totalGross = monthPayrolls.reduce((sum, p) => sum + (parseFloat(p.gross_salary) || 0), 0);
  const totalNet = monthPayrolls.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0);
  const totalGOSI = monthPayrolls.reduce((sum, p) => sum + (parseFloat(p.gosi_employee) || 0) + (parseFloat(p.gosi_employer) || 0), 0);

  const columns = [
    { header: 'Employee', accessor: 'employee_name', render: (row) => <span className="font-medium">{row.employee_name}</span> },
    { header: 'Basic', accessor: 'basic_salary', render: (row) => `${parseFloat(row.basic_salary || 0).toFixed(2)}` },
    { header: 'Allowances', render: (row) => `${((parseFloat(row.housing_allowance) || 0) + (parseFloat(row.transport_allowance) || 0) + (parseFloat(row.other_allowances) || 0)).toFixed(2)}` },
    { header: 'Commission', accessor: 'commission_amount', render: (row) => <span className="text-emerald-600">{parseFloat(row.commission_amount || 0).toFixed(2)}</span> },
    { header: 'Gross', accessor: 'gross_salary', render: (row) => <span className="font-medium">{parseFloat(row.gross_salary || 0).toFixed(2)}</span> },
    { header: 'GOSI', accessor: 'gosi_employee', render: (row) => `${parseFloat(row.gosi_employee || 0).toFixed(2)}` },
    { header: 'Net Salary', accessor: 'net_salary', render: (row) => <span className="font-semibold text-emerald-600">{parseFloat(row.net_salary || 0).toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (row) => <Badge className={row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}>{row.status}</Badge> }
  ];

  if (loadingEmployees || loadingPayrolls) return <LoadingSpinner text="Loading..." />;

  return (
    <div>
      <PageHeader title="Salary Processing" subtitle="Process monthly payroll" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Month" name="month" type="select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} options={months.map(m => ({ value: m, label: m }))} />
            <FormField label="Year" name="year" type="select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} options={[2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }))} />
            <div className="flex flex-col justify-end">
              <Button 
                onClick={() => processMutation.mutate()} 
                disabled={processMutation.isPending || monthPayrolls.length >= activeEmployees.length}
                className="bg-emerald-600 hover:bg-emerald-700 w-full mb-1"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {processMutation.isPending ? 'Processing...' : 'Process Salaries'}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                Dual Commission: 16th-15th cycle<br/>
                Standard: 1st-End of month
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Employees</p>
            <p className="text-2xl font-bold">{monthPayrolls.length} / {activeEmployees.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700">Total Gross</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalGross, 'SAR')}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700">Total GOSI</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalGOSI, 'SAR')}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-700">Total Net</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalNet, 'SAR')}</p>
          </CardContent>
        </Card>
      </div>

      {monthPayrolls.length > 0 ? (
        <DataTable columns={columns} data={monthPayrolls} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Banknote className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No salaries processed for {selectedMonth} {selectedYear}</p>
            <p className="text-sm text-slate-400">Click "Process Salaries" to generate payroll</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}