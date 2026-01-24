import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileSpreadsheet, Printer, Download } from 'lucide-react';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollReports() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: payrolls = [], isLoading } = useQuery({ queryKey: ['payrolls'], queryFn: () => base44.entities.Payroll.list() });
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: () => base44.entities.Employee.list() });

  const yearPayrolls = payrolls.filter(p => p.year === selectedYear);

  // Monthly summary
  const monthlySummary = months.map(month => {
    const monthData = yearPayrolls.filter(p => p.month === month);
    return {
      month: month.substring(0, 3),
      gross: monthData.reduce((sum, p) => sum + (parseFloat(p.gross_salary) || 0), 0),
      net: monthData.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0),
      gosi: monthData.reduce((sum, p) => sum + (parseFloat(p.gosi_employee) || 0) + (parseFloat(p.gosi_employer) || 0), 0),
      count: monthData.length
    };
  });

  // Employee annual summary
  const employeeSummary = employees.map(emp => {
    const empPayrolls = yearPayrolls.filter(p => p.employee_id === emp.id);
    return {
      name: emp.name,
      department: emp.department,
      monthsWorked: empPayrolls.length,
      totalGross: empPayrolls.reduce((sum, p) => sum + (parseFloat(p.gross_salary) || 0), 0),
      totalNet: empPayrolls.reduce((sum, p) => sum + (parseFloat(p.net_salary) || 0), 0),
      totalGOSI: empPayrolls.reduce((sum, p) => sum + (parseFloat(p.gosi_employee) || 0), 0)
    };
  }).filter(e => e.monthsWorked > 0);

  const totalAnnualGross = employeeSummary.reduce((sum, e) => sum + e.totalGross, 0);
  const totalAnnualNet = employeeSummary.reduce((sum, e) => sum + e.totalNet, 0);
  const totalAnnualGOSI = employeeSummary.reduce((sum, e) => sum + e.totalGOSI, 0);

  const columns = [
    { header: 'Employee', accessor: 'name', render: (row) => <span className="font-medium">{row.name}</span> },
    { header: 'Department', accessor: 'department' },
    { header: 'Months', accessor: 'monthsWorked' },
    { header: 'Total Gross', render: (row) => formatCurrency(row.totalGross, 'SAR') },
    { header: 'Total GOSI', render: (row) => formatCurrency(row.totalGOSI, 'SAR') },
    { header: 'Total Net', render: (row) => <span className="font-semibold text-emerald-600">{formatCurrency(row.totalNet, 'SAR')}</span> }
  ];

  if (isLoading) return <LoadingSpinner text="Loading payroll reports..." />;

  return (
    <div>
      <PageHeader 
        title="Payroll Reports" 
        subtitle={`Annual Summary - ${selectedYear}`}
        secondaryActions={
          <div className="flex gap-2">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <FormField label="Year" name="year" type="select" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} options={[2024, 2025, 2026].map(y => ({ value: y, label: y.toString() }))} className="max-w-xs" />
        </CardContent>
      </Card>

      {/* Annual Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Payroll Records</p>
            <p className="text-2xl font-bold">{yearPayrolls.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-700">Annual Gross</p>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAnnualGross, 'SAR')}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <p className="text-sm text-orange-700">Annual GOSI</p>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalAnnualGOSI, 'SAR')}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-700">Annual Net</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAnnualNet, 'SAR')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Payroll Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="gross" name="Gross Salary" fill="#3b82f6" />
                <Bar dataKey="net" name="Net Salary" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Employee Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Employee-wise Annual Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={employeeSummary} />
        </CardContent>
      </Card>
    </div>
  );
}