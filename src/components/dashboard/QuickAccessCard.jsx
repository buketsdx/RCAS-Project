import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/lib/utils"; // <-- Yahan maine sahi address daal diya hai
import { cn } from "@/lib/utils";

export default function QuickAccessCard({ icon: Icon, title, description, href, color = 'emerald' }) {
  const colors = {
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-200',
    blue: 'from-blue-500 to-indigo-600 shadow-blue-200',
    purple: 'from-purple-500 to-pink-600 shadow-purple-200',
    orange: 'from-orange-500 to-red-600 shadow-orange-200',
    cyan: 'from-cyan-500 to-blue-600 shadow-cyan-200'
  };

  return (
    <Link to={createPageUrl(href)}>
      <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 cursor-pointer group hover:-translate-y-1 h-full">
        <div className={cn(
          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-all duration-300",
          colors[color]
        )}>
          <Icon className="h-6 w-6 text-white transform group-hover:scale-110 transition-transform duration-300" />
        </div>
        <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}