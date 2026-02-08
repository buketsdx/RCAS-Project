import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Search, Download, Printer } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function DataTable({ 
  columns, 
  data = [], 
  onRowClick, 
  searchable = true,
  pagination = true,
  pageSize = 10,
  actions,
  emptyMessage = "No data available"
}) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = data.filter(row => {
    if (!search) return true;
    return columns.some(col => {
      const value = row[col.accessor];
      return value && value.toString().toLowerCase().includes(search.toLowerCase());
    });
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = pagination 
    ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredData;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {(searchable || actions) && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-9 bg-slate-50 border-slate-200"
              />
            </div>
          )}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              {columns.map((col, i) => (
                <TableHead key={i} className={cn("font-semibold text-slate-700", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-12 text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow 
                  key={row.id || rowIndex}
                  className={cn(
                    "hover:bg-slate-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className={col.cellClassName}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden bg-slate-50/50">
        {paginatedData.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {paginatedData.map((row, rowIndex) => (
              <Card 
                key={row.id || rowIndex}
                className={cn(
                  "overflow-hidden shadow-sm border-slate-200",
                  onRowClick && "active:scale-[0.98] transition-transform"
                )}
                onClick={() => onRowClick?.(row)}
              >
                <CardContent className="p-4 space-y-3">
                  {columns.map((col, colIndex) => {
                    // Skip if no header (often actions or checkboxes)
                    if (!col.header && !col.accessor) return null;
                    
                    const isActions = col.header === 'Actions' || (!col.header && col.render);
                    const isPrimary = colIndex === 0;

                    if (isActions) {
                      return (
                        <div key={colIndex} className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                           {col.render ? col.render(row) : null}
                        </div>
                      );
                    }

                    return (
                      <div key={colIndex} className={cn("flex justify-between items-start gap-4", isPrimary ? "mb-2" : "")}>
                        <span className={cn(
                          "text-xs font-medium uppercase tracking-wider text-slate-500 shrink-0 mt-0.5",
                          isPrimary && "hidden" // Hide label for first column (usually title)
                        )}>
                          {col.header}
                        </span>
                        <div className={cn(
                          "text-sm text-slate-700 text-right break-words flex-1",
                          isPrimary && "text-lg font-bold text-slate-900 text-left w-full"
                        )}>
                          {col.render ? col.render(row) : row[col.accessor]}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {pagination && totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
          <span className="text-sm text-slate-500">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}