import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  options = [],
  rows = 3,
  error,
  className,
  hint
}) {
  const handleChange = (e) => {
    if (type === 'select') {
      onChange({ target: { name, value: e } });
    } else {
      onChange(e);
    }
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label htmlFor={name} className="text-slate-700 font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      {type === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={cn(
            "bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500",
            error && "border-red-500"
          )}
        />
      ) : type === 'select' ? (
        <Select value={value || 'default'} onValueChange={handleChange} disabled={disabled}>
          <SelectTrigger className={cn(
            "bg-white text-slate-900 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500 relative z-50",
            error && "border-red-500"
          )}>
            <SelectValue placeholder={placeholder || `Select ${label}`} />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white text-slate-900 border border-slate-300">
            {options && options.length > 0 ? (
              options.map((opt) => {
                const optValue = opt.value || opt.id || opt.name;
                return (
                  <SelectItem key={optValue} value={String(optValue)} className="hover:bg-emerald-50">
                    {opt.label || opt.name || opt.value}
                  </SelectItem>
                );
              })
            ) : (
              <SelectItem value="default" disabled>
                No options available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500",
            error && "border-red-500"
          )}
        />
      )}
      
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}