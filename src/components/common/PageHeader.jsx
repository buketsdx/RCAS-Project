import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function PageHeader({ 
  title, 
  subtitle, 
  backUrl, 
  primaryAction, 
  primaryActionIcon: PrimaryIcon = Plus,
  secondaryActions,
  children 
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {backUrl && (
            <Link to={createPageUrl(backUrl)}>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {secondaryActions}
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-200"
            >
              <PrimaryIcon className="h-4 w-4 mr-2" />
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}