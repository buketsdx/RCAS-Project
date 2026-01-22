import React, { useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';
import { Printer, ArrowLeft } from 'lucide-react';
import { createPageUrl } from "@/utils";

export default function PrintInvoice() {
  const printRef = useRef();
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');
  const type = urlParams.get('type') || 'sales';

  const { data: vouchers = [], isLoading: loadingVoucher } = useQuery({
    queryKey: ['voucher', voucherId],
    queryFn: () => base44.entities.Voucher.list()
  });

  const { data: voucherItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ['voucherItems', voucherId],
    queryFn: async () => {
      const all = await base44.entities.VoucherItem.list();
      return all.filter(item => item.voucher_id === voucherId);
    }
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const voucher = vouchers.find(v => v.id === voucherId);
  const company = companies[0];

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
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            {company?.logo_url && <img src={company.logo_url} alt="Logo" className="h-16 mb-2" />}
            <h1 className="text-2xl font-bold text-slate-800">{company?.name || 'Company Name'}</h1>
            {company?.name_arabic && <p className="text-lg text-slate-600">{company.name_arabic}</p>}
            <p className="text-sm text-slate-500 mt-2">{company?.address}</p>
            <p className="text-sm text-slate-500">{company?.city}, {company?.country}</p>
            <p className="text-sm text-slate-500">Phone: {company?.phone}</p>
            <p className="text-sm text-slate-500">VAT No: {company?.vat_number}</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-emerald-600 mb-2">
              {type === 'sales' ? 'TAX INVOICE' : 'PURCHASE INVOICE'}
            </h2>
            <p className="text-lg font-semibold">فاتورة ضريبية</p>
            <div className="mt-4 text-sm">
              <p><strong>Invoice No:</strong> {voucher.voucher_number || `#${voucher.id?.slice(-6)}`}</p>
              <p><strong>Date:</strong> {voucher.date && format(new Date(voucher.date), 'dd/MM/yyyy')}</p>
              {voucher.reference_number && <p><strong>Ref:</strong> {voucher.reference_number}</p>}
            </div>
          </div>
        </div>

        {/* Customer/Supplier Info */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-700 mb-2">{type === 'sales' ? 'Bill To:' : 'Bill From:'}</h3>
            <p className="font-medium">{voucher.party_name || 'Walk-in Customer'}</p>
            {voucher.billing_address && <p className="text-sm text-slate-600">{voucher.billing_address}</p>}
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-700 mb-2">Payment Details:</h3>
            <p className="text-sm">Payment Terms: {voucher.payment_terms || 'Cash'}</p>
            {voucher.due_date && <p className="text-sm">Due Date: {format(new Date(voucher.due_date), 'dd/MM/yyyy')}</p>}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="bg-slate-100">
              <th className="py-3 px-4 text-left text-sm font-semibold">#</th>
              <th className="py-3 px-4 text-left text-sm font-semibold">Description</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Qty</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Rate</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">VAT %</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">VAT Amt</th>
              <th className="py-3 px-4 text-right text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {voucherItems.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="py-3 px-4">{idx + 1}</td>
                <td className="py-3 px-4">{item.stock_item_name || 'Item'}</td>
                <td className="py-3 px-4 text-right">{parseFloat(item.quantity || 0).toFixed(2)}</td>
                <td className="py-3 px-4 text-right">{parseFloat(item.rate || 0).toFixed(2)}</td>
                <td className="py-3 px-4 text-right">{item.vat_rate || 15}%</td>
                <td className="py-3 px-4 text-right">{parseFloat(item.vat_amount || 0).toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-medium">{parseFloat(item.total_amount || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span>Subtotal:</span>
              <span>{parseFloat(voucher.gross_amount || 0).toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>VAT (15%):</span>
              <span>{parseFloat(voucher.vat_amount || 0).toFixed(2)} SAR</span>
            </div>
            <div className="flex justify-between py-3 font-bold text-lg">
              <span>Total:</span>
              <span>{parseFloat(voucher.net_amount || 0).toFixed(2)} SAR</span>
            </div>
          </div>
        </div>

        {/* Narration */}
        {voucher.narration && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm"><strong>Notes:</strong> {voucher.narration}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-slate-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">Generated by RCAS - Rustam Chartered Account System</p>
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