import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { FileText, ArrowRight } from 'lucide-react';

const voucherColors = {
  'Sales': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Purchase': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  'Receipt': 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'Payment': 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  'Journal': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  'Contra': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400'
};

export default function RecentVouchers({ vouchers = [] }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 dark:border-border flex items-center justify-between">
        <h3 className="font-semibold text-primary">Recent Transactions</h3>
        <Link to={createPageUrl('DayBook')} className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-border">
        {vouchers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p>No recent transactions</p>
          </div>
        ) : (
          vouchers.slice(0, 5).map((voucher) => (
            <div key={voucher.id} className="p-4 hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={voucherColors[voucher.voucher_type] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}>
                    {voucher.voucher_type}
                  </Badge>
                  <div>
                    <p className="font-medium text-foreground">
                      {voucher.reference_number || voucher.voucher_number || `#${voucher.id?.slice(-6)}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{voucher.party_name || 'No party'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">{parseFloat(voucher.net_amount || 0).toFixed(2)} SAR</p>
                  <p className="text-xs text-muted-foreground">{voucher.date && format(new Date(voucher.date), 'dd MMM yyyy')}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
