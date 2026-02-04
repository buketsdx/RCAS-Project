import React, { useRef } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Printer, ArrowLeft } from 'lucide-react';
import { createPageUrl } from "@/utils";
import { useCompany } from '@/context/CompanyContext';

export default function PrintInvoice() {
  const printRef = useRef();
  const { selectedCompanyId } = useCompany();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');
  const type = urlParams.get('type') || 'sales';

  const { data: voucher, isLoading: loadingVoucher } = useQuery({
    queryKey: ['voucher', voucherId, selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Voucher.list();
      return list.find(v => v.id === voucherId && String(v.company_id) === String(selectedCompanyId));
    },
    enabled: !!voucherId && !!selectedCompanyId
  });

  const { data: voucherItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['voucherItems', voucherId],
    queryFn: async () => {
      const all = await rcas.entities.VoucherItem.list();
      return all.filter(item => item.voucher_id === voucherId);
    },
    enabled: !!voucherId && !!voucher
  });

  const { data: company } = useQuery({
    queryKey: ['company', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Company.list();
      return list.find(c => String(c.id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const partyLedger = ledgers.find(l => l.id === voucher?.party_ledger_id);

  const handlePrint = () => {
    window.print();
  };

  if (loadingVoucher || loadingItems) return <LoadingSpinner text="Loading invoice..." />;
  if (!voucher) return <div className="p-8 text-center">Invoice not found</div>;

  return (
    <div>
      {/* Print Controls - Hidden on print */}
      <div className="mb-4 flex gap-3 print:hidden">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
          <Printer className="h-4 w-4 mr-2" /> Print Invoice
        </Button>
      </div>

      {/* Invoice Content */}
      <div ref={printRef} className="bg-white p-8 max-w-4xl mx-auto shadow-lg print:shadow-none">
        {/* Header with Company Info */}
        <div className="border-b-4 border-emerald-600 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {company?.logo_url && <img src={company.logo_url} alt="Logo" className="h-20 mb-3" />}
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{company?.name || 'Company Name'}</h1>
                {company?.name_arabic && <p className="text-xl text-slate-600 mt-1">{company.name_arabic}</p>}
              </div>
            </div>
            <div className="text-right">
              <div className="bg-emerald-600 text-white px-6 py-4 rounded-lg mb-3">
                <h2 className="text-2xl font-bold">
                  {type === 'sales' ? 'TAX INVOICE' : 'PURCHASE INVOICE'}
                </h2>
                <p className="text-sm mt-1">فاتورة ضريبية</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <p className="text-slate-500">Company Address:</p>
              <p className="font-medium">{company?.address}</p>
              <p className="text-slate-600">{company?.city}, {company?.country}</p>
            </div>
            <div>
              <p className="text-slate-500">Contact Information:</p>
              <p className="font-medium">Phone: {company?.phone}</p>
              <p className="text-slate-600">Email: {company?.email}</p>
            </div>
            <div>
              <p className="text-slate-500">Tax Information:</p>
              <p className="font-medium">VAT No: {company?.vat_number || 'N/A'}</p>
              {company?.cr_number && <p className="text-slate-600">CR No: {company.cr_number}</p>}
            </div>
          </div>
        </div>

        {/* Customer/Supplier Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-slate-700 mb-3">{type === 'sales' ? 'BILL TO (Customer):' : 'BILL FROM (Supplier):'}</h3>
            <p className="font-bold text-lg">{voucher.party_name || 'Walk-in Customer'}</p>
            {partyLedger?.vat_number && (
              <p className="text-sm text-slate-600 mt-1"><strong>VAT Reg No:</strong> {partyLedger.vat_number}</p>
            )}
            {partyLedger?.contact_person && (
              <p className="text-sm text-slate-600"><strong>Contact:</strong> {partyLedger.contact_person}</p>
            )}
            {voucher.billing_address && (
              <p className="text-sm text-slate-600 mt-2">{voucher.billing_address}</p>
            )}
            {partyLedger?.city && (
              <p className="text-sm text-slate-600">{partyLedger.city}</p>
            )}
            {partyLedger?.phone && (
              <p className="text-sm text-slate-600">Phone: {partyLedger.phone}</p>
            )}
            {partyLedger?.email && (
              <p className="text-sm text-slate-600">Email: {partyLedger.email}</p>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-700 mb-3">INVOICE DETAILS:</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Invoice No:</strong> {voucher.voucher_number || `#${voucher.id?.slice(-6)}`}</p>
              <p><strong>Date:</strong> {voucher.date && format(new Date(voucher.date), 'dd/MM/yyyy')}</p>
              {voucher.reference_number && <p><strong>Reference:</strong> {voucher.reference_number}</p>}
              <p><strong>Payment Terms:</strong> {voucher.payment_terms || 'Cash'}</p>
              {voucher.due_date && <p><strong>Due Date:</strong> {format(new Date(voucher.due_date), 'dd/MM/yyyy')}</p>}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="font-semibold text-slate-800 mb-3 text-lg">LINE ITEMS:</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-100 border-y-2 border-emerald-600">
                <th className="py-3 px-4 text-left text-sm font-bold">#</th>
                <th className="py-3 px-4 text-left text-sm font-bold">Description</th>
                <th className="py-3 px-4 text-right text-sm font-bold">Qty</th>
                <th className="py-3 px-4 text-right text-sm font-bold">Rate (SAR)</th>
                <th className="py-3 px-4 text-right text-sm font-bold">Amount (SAR)</th>
                <th className="py-3 px-4 text-right text-sm font-bold">VAT %</th>
                <th className="py-3 px-4 text-right text-sm font-bold">VAT (SAR)</th>
                <th className="py-3 px-4 text-right text-sm font-bold">Total (SAR)</th>
              </tr>
            </thead>
            <tbody>
              {voucherItems.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="py-3 px-4 text-sm">{idx + 1}</td>
                  <td className="py-3 px-4 text-sm font-medium">{item.stock_item_name || 'Item'}</td>
                  <td className="py-3 px-4 text-right text-sm">{parseFloat(item.quantity || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-sm">{parseFloat(item.rate || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-sm">{parseFloat((item.quantity || 0) * (item.rate || 0)).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-sm font-medium">{item.vat_rate || 15}%</td>
                  <td className="py-3 px-4 text-right text-sm text-emerald-600 font-medium">{parseFloat(item.vat_amount || 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-sm font-bold">{parseFloat(item.total_amount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-80">
            <div className="bg-slate-50 p-4 rounded-t-lg">
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="font-medium">Subtotal (without VAT):</span>
                <span className="font-medium">{formatCurrency(parseFloat(voucher.gross_amount || 0), 'SAR')}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-sm">
                <span className="font-medium">VAT @ 15%:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(parseFloat(voucher.vat_amount || 0), 'SAR')}</span>
              </div>
            </div>
            <div className="bg-emerald-600 text-white p-4 rounded-b-lg">
              <div className="flex justify-between py-2">
                <span className="text-lg font-bold">TOTAL AMOUNT DUE:</span>
                <span className="text-lg font-bold">{formatCurrency(parseFloat(voucher.net_amount || 0), 'SAR')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Narration */}
        {voucher.narration && (
          <div className="mt-6 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
            <p className="text-sm font-semibold text-amber-900 mb-1">NOTES:</p>
            <p className="text-sm text-amber-800">{voucher.narration}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-4 border-slate-300">
          <div className="grid grid-cols-3 gap-6 text-sm mb-8">
            <div>
              <p className="font-semibold text-slate-700 mb-4">Prepared By:</p>
              <p className="border-t-2 border-slate-400 pt-8 text-slate-600">_____________________</p>
              <p className="text-xs text-slate-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-4">Authorized By:</p>
              <p className="border-t-2 border-slate-400 pt-8 text-slate-600">_____________________</p>
              <p className="text-xs text-slate-500 mt-1">Signature</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 mb-4">Company Stamp/Seal:</p>
              <p className="border-t-2 border-slate-400 pt-8 text-slate-600 h-16">_____________________</p>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 border-t pt-4 space-y-1">
            <p className="font-semibold text-slate-600">This is a computer-generated invoice. No signature required.</p>
            <p>For inquiries, contact: {company?.email} | {company?.phone}</p>
            <p className="text-slate-700 font-medium mt-2">Thank you for your business!</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #root { visibility: visible; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}