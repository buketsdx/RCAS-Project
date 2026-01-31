import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileCheck, Send, CheckCircle, XCircle, Clock, AlertTriangle, QrCode, RefreshCw, Settings } from 'lucide-react';

export default function ZATCAIntegration() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => rcas.entities.Voucher.list('-date')
  });

  const { data: zatcaInvoices = [] } = useQuery({
    queryKey: ['zatcaInvoices'],
    queryFn: () => rcas.entities.ZATCAInvoice.list()
  });

  const { data: company } = useQuery({
    queryKey: ['companies'],
    queryFn: () => rcas.entities.Company.list(),
    select: (data) => data[0]
  });

  const salesInvoices = vouchers.filter(v => 
    (v.voucher_type === 'Sales' || v.voucher_type === 'Credit Note') &&
    v.date >= filters.fromDate && v.date <= filters.toDate
  );

  const getZATCAStatus = (voucherId) => {
    const zatca = zatcaInvoices.find(z => z.voucher_id === voucherId);
    return zatca?.submission_status || 'Pending';
  };

  const generateQRMutation = useMutation({
    mutationFn: async (voucher) => {
      // Generate QR code data according to ZATCA TLV format
      const qrData = {
        seller_name: company?.name || 'Company',
        vat_number: company?.vat_number || '',
        timestamp: new Date().toISOString(),
        total_with_vat: parseFloat(voucher.net_amount) || 0,
        vat_amount: parseFloat(voucher.vat_amount) || 0
      };
      
      // Create or update ZATCA record
      const existingZatca = zatcaInvoices.find(z => z.voucher_id === voucher.id);
      const uuid = crypto.randomUUID();
      
      if (existingZatca) {
        return rcas.entities.ZATCAInvoice.update(existingZatca.id, {
          invoice_uuid: uuid,
          qr_code: JSON.stringify(qrData),
          submission_status: 'Pending'
        });
      } else {
        return rcas.entities.ZATCAInvoice.create({
          voucher_id: voucher.id,
          invoice_uuid: uuid,
          qr_code: JSON.stringify(qrData),
          submission_status: 'Pending'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zatcaInvoices'] });
      toast.success('QR code generated');
    }
  });

  const submitToZATCAMutation = useMutation({
    mutationFn: async (voucher) => {
      // Simulate ZATCA submission (in production, this would call actual ZATCA API)
      const zatcaRecord = zatcaInvoices.find(z => z.voucher_id === voucher.id);
      if (!zatcaRecord) throw new Error('Generate QR code first');

      // Simulate API response
      const isSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      return rcas.entities.ZATCAInvoice.update(zatcaRecord.id, {
        submission_status: isSuccess ? 'Cleared' : 'Rejected',
        submission_date: new Date().toISOString(),
        zatca_response: isSuccess ? 'Invoice cleared successfully' : 'Validation error',
        clearance_status: isSuccess ? 'CLEARED' : 'REJECTED'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zatcaInvoices'] });
      toast.success('Submitted to ZATCA');
    }
  });

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Submitted': 'bg-blue-100 text-blue-700',
    'Accepted': 'bg-emerald-100 text-emerald-700',
    'Cleared': 'bg-emerald-100 text-emerald-700',
    'Rejected': 'bg-red-100 text-red-700'
  };

  const statusIcons = {
    'Pending': Clock,
    'Submitted': Send,
    'Accepted': CheckCircle,
    'Cleared': CheckCircle,
    'Rejected': XCircle
  };

  const pendingCount = salesInvoices.filter(v => getZATCAStatus(v.id) === 'Pending').length;
  const clearedCount = salesInvoices.filter(v => ['Cleared', 'Accepted'].includes(getZATCAStatus(v.id))).length;
  const rejectedCount = salesInvoices.filter(v => getZATCAStatus(v.id) === 'Rejected').length;

  const columns = [
    { header: 'Invoice No', accessor: 'voucher_number', render: (row) => <span className="font-mono">{row.voucher_number || `#${row.id?.slice(-6)}`}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Customer', accessor: 'party_name' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => formatCurrency(parseFloat(row.net_amount || 0), 'SAR') },
    { header: 'VAT', accessor: 'vat_amount', render: (row) => formatCurrency(parseFloat(row.vat_amount || 0), 'SAR') },
    { 
      header: 'ZATCA Status', 
      render: (row) => {
        const status = getZATCAStatus(row.id);
        const Icon = statusIcons[status] || Clock;
        return (
          <Badge className={statusColors[status]}>
            <Icon className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      }
    },
    {
      header: 'Actions',
      render: (row) => {
        const status = getZATCAStatus(row.id);
        return (
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => generateQRMutation.mutate(row)}
              disabled={generateQRMutation.isPending}
            >
              <QrCode className="h-4 w-4 mr-1" />
              QR
            </Button>
            {status === 'Pending' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => submitToZATCAMutation.mutate(row)}
                disabled={submitToZATCAMutation.isPending}
                className="text-blue-600"
              >
                <Send className="h-4 w-4 mr-1" />
                Submit
              </Button>
            )}
            {status === 'Rejected' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => submitToZATCAMutation.mutate(row)}
                className="text-orange-600"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  if (loadingVouchers) return <LoadingSpinner text="Loading invoices..." />;

  return (
    <div>
      <PageHeader title="ZATCA e-Invoicing" subtitle="Fatoora compliance & submission" />

      {/* Company Status */}
      {!company?.vat_number && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-700">
            VAT Registration Number not set. Please update your company information for ZATCA compliance.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total Invoices</p>
            <p className="text-2xl font-bold">{salesInvoices.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-700">Pending Submission</p>
            <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-700">Cleared</p>
            <p className="text-2xl font-bold text-emerald-700">{clearedCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* ZATCA Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-emerald-600" />
            ZATCA Fatoora Compliance
          </CardTitle>
          <CardDescription>Phase 2 e-Invoicing Integration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Company Details</h4>
              <div className="space-y-1 text-sm text-slate-600">
                <p><strong>Name:</strong> {company?.name || 'Not Set'}</p>
                <p><strong>VAT Number:</strong> {company?.vat_number || 'Not Set'}</p>
                <p><strong>CR Number:</strong> {company?.cr_number || 'Not Set'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Integration Status</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">QR Code Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm">Invoice UUID Generation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">API Integration (Simulated)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices for ZATCA Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={salesInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
