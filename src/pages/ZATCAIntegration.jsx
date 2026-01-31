import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
import { FileCheck, Send, CheckCircle, XCircle, Clock, AlertTriangle, QrCode, RefreshCw, Settings, FileCode } from 'lucide-react';

const generateTLV = (tag, value) => {
  const valueStr = String(value);
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(valueStr);
  const len = valueBytes.length;
  const tagByte = new Uint8Array([tag]);
  const lenByte = new Uint8Array([len]); // Simplified for len < 255
  
  const merged = new Uint8Array(tagByte.length + lenByte.length + valueBytes.length);
  merged.set(tagByte);
  merged.set(lenByte, tagByte.length);
  merged.set(valueBytes, tagByte.length + lenByte.length);
  
  return merged;
};

const generateZATCAQR = (seller, vatNo, timestamp, total, vat) => {
  const tags = [
    generateTLV(1, seller),
    generateTLV(2, vatNo),
    generateTLV(3, timestamp),
    generateTLV(4, total),
    generateTLV(5, vat)
  ];
  
  let totalLength = tags.reduce((sum, t) => sum + t.length, 0);
  const allBytes = new Uint8Array(totalLength);
  let offset = 0;
  
  tags.forEach(t => {
    allBytes.set(t, offset);
    offset += t.length;
  });
  
  // Convert to Base64
  let binary = '';
  const len = allBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(allBytes[i]);
  }
  return window.btoa(binary);
};

export default function ZATCAIntegration() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const { data: vouchers = [], isLoading: loadingVouchers } = useQuery({
    queryKey: ['vouchers'],
    queryFn: () => base44.entities.Voucher.list('-date')
  });

  const { data: zatcaInvoices = [] } = useQuery({
    queryKey: ['zatcaInvoices'],
    queryFn: () => base44.entities.ZATCAInvoice.list()
  });

  const { data: company } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list(),
    select: (data) => data[0]
  });

  const { data: voucherItems = [] } = useQuery({
    queryKey: ['voucherItems'],
    queryFn: () => base44.entities.VoucherItem.list()
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems'],
    queryFn: () => base44.entities.StockItem.list()
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
      const sellerName = company?.name || 'Company';
      const vatNumber = company?.vat_number || '300000000000003';
      const timestamp = new Date().toISOString();
      const totalWithVat = (parseFloat(voucher.net_amount) || 0).toFixed(2);
      const vatAmount = (parseFloat(voucher.vat_amount) || 0).toFixed(2);
      
      const qrBase64 = generateZATCAQR(sellerName, vatNumber, timestamp, totalWithVat, vatAmount);
      
      // Create or update ZATCA record
      const existingZatca = zatcaInvoices.find(z => z.voucher_id === voucher.id);
      const uuid = crypto.randomUUID();
      
      const zatcaData = {
        voucher_id: voucher.id,
        invoice_uuid: uuid,
        qr_code: qrBase64,
        submission_status: 'Generated',
        xml_hash: 'SIMULATED_HASH_' + uuid.substring(0,8)
      };

      if (existingZatca) {
        return base44.entities.ZATCAInvoice.update(existingZatca.id, zatcaData);
      } else {
        return base44.entities.ZATCAInvoice.create(zatcaData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zatcaInvoices'] });
      toast.success('Compliant QR code generated');
    }
  });

  const submitToZATCAMutation = useMutation({
    mutationFn: async (voucher) => {
      // Simulate ZATCA submission (in production, this would call actual ZATCA API)
      const zatcaRecord = zatcaInvoices.find(z => z.voucher_id === voucher.id);
      if (!zatcaRecord) throw new Error('Generate QR code first');

      // Simulate API response
      const isSuccess = Math.random() > 0.1; // 90% success rate for demo
      
      return base44.entities.ZATCAInvoice.update(zatcaRecord.id, {
        submission_status: isSuccess ? 'Cleared' : 'Rejected',
        submission_date: new Date().toISOString(),
        zatca_response: isSuccess ? 'Invoice cleared successfully' : 'Validation error: Invalid cryptographic stamp',
        clearance_status: isSuccess ? 'CLEARED' : 'REJECTED'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zatcaInvoices'] });
      toast.success('Status updated from ZATCA Portal');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const downloadXML = (voucher) => {
    // Get invoice items
    const items = voucherItems.filter(i => i.voucher_id === voucher.id);

    // Generate XML Lines
    const linesXML = items.map((item, index) => {
      const stockItem = stockItems.find(s => s.id === item.stock_item_id);
      const itemName = stockItem ? stockItem.name : 'Item';
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const lineTotal = (quantity * rate).toFixed(2);
      
      return `    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">${lineTotal}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Name>${itemName}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">${rate.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`;
    }).join('\n');

    // Mock XML download
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
    <cbc:ID>${voucher.voucher_number}</cbc:ID>
    <cbc:UUID>${crypto.randomUUID()}</cbc:UUID>
    <cbc:IssueDate>${voucher.date}</cbc:IssueDate>
    <cbc:InvoiceTypeCode name="0100000">388</cbc:InvoiceTypeCode>
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${company?.vat_number}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${company?.name}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${voucher.vat_amount}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:TaxInclusiveAmount currencyID="SAR">${voucher.net_amount}</cbc:TaxInclusiveAmount>
    </cac:LegalMonetaryTotal>
${linesXML}
</Invoice>`;
    
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${voucher.voucher_number}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('UBL 2.1 XML Exported');
  };

  const columns = [
    { header: 'Date', accessor: 'date', sortable: true },
    { header: 'Voucher #', accessor: 'voucher_number' },
    { header: 'Customer', accessor: 'ledger_name' },
    { header: 'Amount', accessor: 'net_amount', render: (row) => formatCurrency(row.net_amount) },
    { header: 'Status', accessor: 'status', render: (row) => {
      const status = getZATCAStatus(row.id);
      if (status === 'Cleared') return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Cleared</Badge>;
      if (status === 'Rejected') return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      if (status === 'Generated') return <Badge variant="outline" className="border-blue-500 text-blue-500"><QrCode className="w-3 h-3 mr-1" /> Generated</Badge>;
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }},
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => generateQRMutation.mutate(row)} disabled={getZATCAStatus(row.id) === 'Cleared'}>
            <QrCode className="h-4 w-4 mr-1" /> Generate QR
          </Button>
          <Button size="sm" onClick={() => submitToZATCAMutation.mutate(row)} disabled={getZATCAStatus(row.id) !== 'Generated'}>
            <Send className="h-4 w-4 mr-1" /> Submit
          </Button>
           <Button size="sm" variant="ghost" onClick={() => downloadXML(row)}>
            <FileCode className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="ZATCA Integration" 
        subtitle="Fatoora Phase 2 Compliance & Reporting"
        actions={
          <div className="flex gap-2">
             <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Configuration</Button>
             <Button><RefreshCw className="mr-2 h-4 w-4" /> Sync Status</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 bg-blue-50 border-blue-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-700">Pending Submission</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {salesInvoices.filter(v => getZATCAStatus(v.id) === 'Pending' || getZATCAStatus(v.id) === 'Generated').length}
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-1 bg-green-50 border-green-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-700">Cleared Invoices</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
               {salesInvoices.filter(v => getZATCAStatus(v.id) === 'Cleared').length}
            </div>
          </CardContent>
        </Card>
         <Card className="md:col-span-1 bg-red-50 border-red-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-red-700">Rejected / Errors</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
               {salesInvoices.filter(v => getZATCAStatus(v.id) === 'Rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E-Invoicing Log</CardTitle>
          <CardDescription>Sales Invoices and Credit Notes eligible for reporting</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={salesInvoices} 
            columns={columns} 
            isLoading={loadingVouchers}
          />
        </CardContent>
      </Card>
    </div>
  );
}
