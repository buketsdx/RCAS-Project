import React from 'react';
import { cn } from "@/lib/utils";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className, onClick }) {
  return (
    <div 
      className={cn(
        "bg-card rounded-2xl p-6 shadow-sm border border-border hover:shadow-xl hover:border-primary/20 transition-all duration-300 group",
        onClick && "cursor-pointer hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-card-foreground mt-2">{value}</h3>
          {subtitle && <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 mt-3 text-sm font-medium",
              trendUp ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full" : "text-red-600 dark:text-red-400 bg-red-500/10 w-fit px-2 py-0.5 rounded-full"
            )}>
              <span>{trendUp ? '↑' : '↓'} {trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3.5 bg-primary/10 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
            <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
          </div>
        )}
      </div>
    </div>
  );
}