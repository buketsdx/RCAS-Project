import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";

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
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-primary">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {secondaryActions}
          {primaryAction && (
            <Button 
              onClick={primaryAction.onClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
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