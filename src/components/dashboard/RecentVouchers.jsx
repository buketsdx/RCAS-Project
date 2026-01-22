import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils"; // <-- Yahan maine 'lib' jod diya hai
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { FileText, ArrowRight } from 'lucide-react';

const voucherColors = {
  'Sales': 'bg-emerald-100 text-emerald-700',
  'Purchase': 'bg-blue-100 text-blue-700',
  'Receipt': 'bg-purple-100 text-purple-700',
  'Payment': 'bg-orange-100 text-orange-700',
  'Journal': 'bg-slate-100 text-slate-700',
  'Contra': 'bg-cyan-100 text-cyan-700'
};

export default function RecentVouchers({ vouchers = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
        <Link to={createPageUrl('DayBook')} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {vouchers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p>No recent transactions</p>
          </div>
        ) : (
          vouchers.slice(0, 5).map((voucher) => (
            <div key={voucher.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={voucherColors[voucher.voucher_type] || 'bg-slate-100 text-slate-700'}>
                    {voucher.voucher_type}
                  </Badge>
                  <div>
                    <p className="font-medium text-slate-800">{voucher.voucher_number || `#${voucher.id?.slice(-6)}`}</p>
                    <p className="text-xs text-slate-500">{voucher.party_name || 'No party'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">{parseFloat(voucher.net_amount || 0).toFixed(2)} SAR</p>
                  <p className="text-xs text-slate-500">{voucher.date && format(new Date(voucher.date), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}