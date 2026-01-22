import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, startOfQuarter, endOfQuarter, subQuarters } from 'date-fns';
import { BadgePercent, FileText, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function VATReturns() {
  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => base44.entities.Voucher.list()
  });

  const { data: company } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    select: (data) => data[0]
  });

  // Generate quarterly data for last 4 quarters
  const quarters = Array.from({ length: 4 }, (_, i) => {
    const date = subQuarters(new Date(), i);
    const start = startOfQuarter(date);
    const end = endOfQuarter(date);
    return {
      label: `Q${Math.ceil((start.getMonth() + 1) / 3)} ${format(start, 'yyyy')}`,
      fromDate: format(start, 'yyyy-MM-dd'),
      toDate: format(end, 'yyyy-MM-dd')
    };
  }).reverse();

  const quarterlyData = quarters.map(q => {
    const periodVouchers = vouchers.filter(v => v.date >= q.fromDate && v.date <= q.toDate);
    
    const sales = periodVouchers.filter(v => v.voucher_type === 'Sales');
    const purchases = periodVouchers.filter(v => v.voucher_type === 'Purchase');
    
    const salesAmount = sales.reduce((sum, v) => sum + (parseFloat(v.gross_amount) || 0), 0);
    const salesVAT = sales.reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0);
    const purchaseAmount = purchases.reduce((sum, v) => sum + (parseFloat(v.gross_amount) || 0), 0);
    const purchaseVAT = purchases.reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0);
    
    return {
      ...q,
      salesAmount,
      salesVAT,
      purchaseAmount,
      purchaseVAT,
      netVAT: salesVAT - purchaseVAT
    };
  });

  if (isLoading) return <LoadingSpinner text="Loading VAT returns..." />;

  return (
    <div>
      <PageHeader title="VAT Returns" subtitle="Quarterly VAT filing summary" />

      {/* Company Info */}
      {company && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-500">Company Name</p>
                <p className="font-semibold">{company.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">VAT Registration Number</p>
                <p className="font-semibold">{company.vat_number || 'Not Set'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">CR Number</p>
                <p className="font-semibold">{company.cr_number || 'Not Set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quarterly Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quarterly VAT Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Sales (SAR)</TableHead>
                <TableHead className="text-right">Output VAT</TableHead>
                <TableHead className="text-right">Purchases (SAR)</TableHead>
                <TableHead className="text-right">Input VAT</TableHead>
                <TableHead className="text-right">Net VAT</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quarterlyData.map((q, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{q.label}</TableCell>
                  <TableCell className="text-right">{q.salesAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-blue-600">{q.salesVAT.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{q.purchaseAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{q.purchaseVAT.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-semibold ${q.netVAT >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {q.netVAT >= 0 ? '' : '('}{Math.abs(q.netVAT).toFixed(2)}{q.netVAT >= 0 ? '' : ')'}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Filing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            ZATCA Filing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-slate-600">
            <p>1. VAT returns must be filed quarterly through ZATCA portal</p>
            <p>2. Filing deadline is within 30 days from the end of each quarter</p>
            <p>3. Ensure all sales and purchase invoices are properly recorded with VAT</p>
            <p>4. Keep all supporting documents for at least 6 years</p>
            <p>5. Late filing may result in penalties as per Saudi VAT regulations</p>
            
            <div className="pt-4 border-t mt-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-4 w-4 mr-2" />
                Generate VAT Return Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}