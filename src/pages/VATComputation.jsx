import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FormField from '@/components/forms/FormField';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BadgePercent, Printer, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function VATComputation() {
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: vouchers = [], isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => base44.entities.Voucher.list()
  });

  const filteredVouchers = vouchers.filter(v => v.date >= filters.fromDate && v.date <= filters.toDate);

  const salesVouchers = filteredVouchers.filter(v => v.voucher_type === 'Sales');
  const purchaseVouchers = filteredVouchers.filter(v => v.voucher_type === 'Purchase');
  const creditNotes = filteredVouchers.filter(v => v.voucher_type === 'Credit Note');
  const debitNotes = filteredVouchers.filter(v => v.voucher_type === 'Debit Note');

  const totalSales = salesVouchers.reduce((sum, v) => sum + (parseFloat(v.gross_amount) || 0), 0);
  const totalSalesVAT = salesVouchers.reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0);
  
  const totalPurchases = purchaseVouchers.reduce((sum, v) => sum + (parseFloat(v.gross_amount) || 0), 0);
  const totalPurchaseVAT = purchaseVouchers.reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0);

  const totalCreditNotes = creditNotes.reduce((sum, v) => sum + (parseFloat(v.gross_amount) || 0), 0);
  const totalCreditNoteVAT = creditNotes.reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0);

  const totalDebitNotes = debitNotes.reduce((sum, v) => sum + (parseFloat(v.gross_amount) || 0), 0);
  const totalDebitNoteVAT = debitNotes.reduce((sum, v) => sum + (parseFloat(v.vat_amount) || 0), 0);

  const outputVAT = totalSalesVAT - totalCreditNoteVAT;
  const inputVAT = totalPurchaseVAT - totalDebitNoteVAT;
  const netVAT = outputVAT - inputVAT;

  if (isLoading) return <LoadingSpinner text="Calculating VAT..." />;

  return (
    <div>
      <PageHeader 
        title="VAT Computation" 
        subtitle={`Tax Period: ${format(new Date(filters.fromDate), 'dd MMM yyyy')} - ${format(new Date(filters.toDate), 'dd MMM yyyy')}`}
        secondaryActions={
          <div className="flex gap-2">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
            <Button variant="outline"><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* Output VAT */}
      <Card className="mb-6">
        <CardHeader className="bg-blue-50">
          <CardTitle className="text-blue-700">Output VAT (VAT on Sales)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Taxable Amount (SAR)</TableHead>
                <TableHead className="text-right">VAT Amount (SAR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Standard Rated Sales (15%)</TableCell>
                <TableCell className="text-right">{totalSales.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totalSalesVAT.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-red-600">Less: Credit Notes</TableCell>
                <TableCell className="text-right text-red-600">({totalCreditNotes.toFixed(2)})</TableCell>
                <TableCell className="text-right text-red-600">({totalCreditNoteVAT.toFixed(2)})</TableCell>
              </TableRow>
              <TableRow className="bg-blue-50 font-bold">
                <TableCell>Total Output VAT</TableCell>
                <TableCell className="text-right">{(totalSales - totalCreditNotes).toFixed(2)}</TableCell>
                <TableCell className="text-right">{outputVAT.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Input VAT */}
      <Card className="mb-6">
        <CardHeader className="bg-emerald-50">
          <CardTitle className="text-emerald-700">Input VAT (VAT on Purchases)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Taxable Amount (SAR)</TableHead>
                <TableHead className="text-right">VAT Amount (SAR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Standard Rated Purchases (15%)</TableCell>
                <TableCell className="text-right">{totalPurchases.toFixed(2)}</TableCell>
                <TableCell className="text-right">{totalPurchaseVAT.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-red-600">Less: Debit Notes</TableCell>
                <TableCell className="text-right text-red-600">({totalDebitNotes.toFixed(2)})</TableCell>
                <TableCell className="text-right text-red-600">({totalDebitNoteVAT.toFixed(2)})</TableCell>
              </TableRow>
              <TableRow className="bg-emerald-50 font-bold">
                <TableCell>Total Input VAT</TableCell>
                <TableCell className="text-right">{(totalPurchases - totalDebitNotes).toFixed(2)}</TableCell>
                <TableCell className="text-right">{inputVAT.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Net VAT */}
      <Card className={netVAT >= 0 ? 'border-red-200' : 'border-emerald-200'}>
        <CardContent className="py-8">
          <div className="text-center">
            <BadgePercent className={`h-12 w-12 mx-auto mb-4 ${netVAT >= 0 ? 'text-red-600' : 'text-emerald-600'}`} />
            <p className="text-lg text-slate-600 mb-2">
              {netVAT >= 0 ? 'VAT Payable to ZATCA' : 'VAT Refundable from ZATCA'}
            </p>
            <p className={`text-4xl font-bold ${netVAT >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {Math.abs(netVAT).toFixed(2)} SAR
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}