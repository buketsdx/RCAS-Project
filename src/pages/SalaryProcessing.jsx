import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(months[currentDate.getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const { data: employees = [], isLoading: loadingEmployees } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });
  const { data: payrolls = [], isLoading: loadingPayrolls } = useQuery({ queryKey: ['payrolls'], queryFn: () => base44.entities.Payroll.list() });

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
        const gross = basic + housing + transport + other;
        
        const gosiEmployee = basic * 0.0975; // 9.75% employee contribution
        const gosiEmployer = basic * 0.1175; // 11.75% employer contribution
        const totalDeductions = gosiEmployee;
        const netSalary = gross - totalDeductions;

        const payrollData = {
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
          gross_salary: gross,
          gosi_employee: gosiEmployee,
          gosi_employer: gosiEmployer,
          total_deductions: totalDeductions,
          net_salary: netSalary,
          status: 'Processed'
        };

        results.push(await base44.entities.Payroll.create(payrollData));
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
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
            <div className="flex items-end">
              <Button 
                onClick={() => processMutation.mutate()} 
                disabled={processMutation.isPending || monthPayrolls.length >= activeEmployees.length}
                className="bg-emerald-600 hover:bg-emerald-700 w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {processMutation.isPending ? 'Processing...' : 'Process Salaries'}
              </Button>
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
            <p className="text-2xl font-bold text-blue-700">{totalGross.toFixed(2)} SAR</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700">Total GOSI</p>
            <p className="text-2xl font-bold text-orange-700">{totalGOSI.toFixed(2)} SAR</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-700">Total Net</p>
            <p className="text-2xl font-bold text-emerald-700">{totalNet.toFixed(2)} SAR</p>
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