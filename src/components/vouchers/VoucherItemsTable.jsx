import React from 'react';
import { useCompany } from '@/context/CompanyContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';

export default function VoucherItemsTable({
  items = [],
  stockItems = [],
  onItemChange,
  onAddItem,
  onRemoveItem,
  showVAT = true
}) {
  const { company } = useCompany();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          item: 'Service/Product',
          addItem: 'Add Service/Product',
          selectItem: 'Select Service/Product'
        };
      case 'Restaurant':
        return {
          item: 'Menu Item',
          addItem: 'Add Menu Item',
          selectItem: 'Select Menu Item'
        };
      default:
        return {
          item: 'Item',
          addItem: 'Add Item',
          selectItem: 'Select item'
        };
    }
  };

  const terms = getTerminology();

  const calculateItem = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const discountPercent = parseFloat(item.discount_percent) || 0;
    
    const grossAmount = qty * rate;
    const discountAmount = (grossAmount * discountPercent) / 100;
    const amountAfterDiscount = grossAmount - discountAmount;
    const vatRate = showVAT ? (parseFloat(item.vat_rate) || 15) : 0;
    const vatAmount = (amountAfterDiscount * vatRate) / 100;
    const totalAmount = amountAfterDiscount + vatAmount;

    return {
      ...item,
      discount_amount: discountAmount,
      amount: amountAfterDiscount,
      vat_amount: vatAmount,
      total_amount: totalAmount
    };
  };

  const handleItemChange = (index, field, value) => {
    const updatedItem = { ...items[index], [field]: value };
    
    if (field === 'stock_item_id') {
      const stockItem = stockItems.find(s => s.id === value);
      if (stockItem) {
        updatedItem.stock_item_name = stockItem.name;
        updatedItem.rate = stockItem.selling_price || 0;
        updatedItem.unit = stockItem.unit_id;
        updatedItem.vat_rate = stockItem.vat_rate || 15;
      }
    }

    const calculatedItem = calculateItem(updatedItem);
    onItemChange(index, calculatedItem);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{terms.item}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Disc %</th>
              {showVAT && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">VAT %</th>
              )}
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Select 
                    value={item.stock_item_id || ''} 
                    onValueChange={(v) => handleItemChange(index, 'stock_item_id', v)}
                  >
                    <SelectTrigger className="min-w-[200px] bg-white">
                      <SelectValue placeholder={terms.selectItem} />
                    </SelectTrigger>
                    <SelectContent>
                      {stockItems.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    className="w-20 bg-white"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    className="w-24 bg-white"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    value={item.discount_percent || ''}
                    onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                    className="w-16 bg-white"
                  />
                </td>
                {showVAT && (
                  <td className="px-4 py-2">
                    <Input
                      type="number"
                      value={item.vat_rate || 15}
                      onChange={(e) => handleItemChange(index, 'vat_rate', e.target.value)}
                      className="w-16 bg-white"
                    />
                  </td>
                )}
                <td className="px-4 py-2 text-right font-semibold text-slate-700">
                  {(item.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(index)}
                    className="h-8 w-8 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={onAddItem}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          {terms.addItem}
        </Button>
      </div>
    </div>
  );
}