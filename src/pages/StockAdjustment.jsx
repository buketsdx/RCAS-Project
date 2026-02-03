import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function StockAdjustment() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: 'Stock Increase',
    date: format(new Date(), 'yyyy-MM-dd'),
    reference_number: '',
    item_id: '',
    quantity: '',
    rate: '',
    narration: ''
  });

  const { data: items = [], isLoading } = useQuery({ 
    queryKey: ['stockItems'], 
    queryFn: () => rcas.entities.StockItem.list() 
  });

  const selectedItem = items.find(i => i.id === formData.item_id);

  // Auto-fill rate when item changes
  useEffect(() => {
    if (selectedItem && !formData.rate) {
      setFormData(prev => ({
        ...prev,
        rate: selectedItem.cost_price || selectedItem.opening_rate || ''
      }));
    }
  }, [selectedItem?.id]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Create Voucher
      const voucher = await rcas.entities.Voucher.create({
        voucher_type: data.type,
        date: data.date,
        voucher_number: `SA-${Date.now()}`,
        reference_number: data.reference_number,
        narration: data.narration,
        status: 'Confirmed',
        party_name: 'Stock Adjustment',
        net_amount: (parseFloat(data.quantity) || 0) * (parseFloat(data.rate) || 0)
      });

      // 2. Create Voucher Item
      await rcas.entities.VoucherItem.create({
        voucher_id: voucher.id,
        stock_item_id: data.item_id,
        quantity: parseFloat(data.quantity),
        rate: parseFloat(data.rate),
        amount: (parseFloat(data.quantity) || 0) * (parseFloat(data.rate) || 0)
      });

      // 3. Update Stock Item Current Qty
      if (selectedItem) {
        const qtyChange = data.type === 'Stock Increase' ? parseFloat(data.quantity) : -parseFloat(data.quantity);
        const newQty = (parseFloat(selectedItem.current_qty) || 0) + qtyChange;
        
        await rcas.entities.StockItem.update(selectedItem.id, {
          current_qty: newQty
        });
      }

      return voucher;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockItems'] });
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['voucherItems'] });
      toast.success('Stock adjustment saved successfully');
      // Reset form but keep date and type
      setFormData(prev => ({ 
        ...prev, 
        reference_number: '',
        item_id: '', 
        quantity: '', 
        rate: '', 
        narration: '' 
      }));
    },
    onError: (error) => {
      toast.error('Failed to save adjustment: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.item_id || !formData.quantity) {
      toast.error('Please select an item and enter quantity');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader 
        title="Stock Adjustment" 
        subtitle="Manually increase or decrease stock levels"
      />

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-emerald-600" />
              New Adjustment Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Adjustment Type"
                  name="type"
                  type="select"
                  value={formData.type}
                  onChange={handleChange}
                  options={[
                    { value: 'Stock Increase', label: 'Stock Increase (Inward)' },
                    { value: 'Stock Decrease', label: 'Stock Decrease (Outward)' }
                  ]}
                  required
                />
                <FormField
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Stock Item"
                  name="item_id"
                  type="select"
                  value={formData.item_id}
                  onChange={handleChange}
                  options={[
                    { value: '', label: 'Select Item' },
                    ...items.map(i => ({ value: i.id, label: i.name }))
                  ]}
                  required
                />
                <FormField
                  label="Reference No (Optional)"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="e.g. PHY-001"
                />
              </div>

              {selectedItem && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm flex gap-4 border border-slate-100">
                  <div>
                    <span className="text-slate-500">Current Stock: </span>
                    <span className="font-semibold">{parseFloat(selectedItem.current_qty || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Cost Price: </span>
                    <span className="font-semibold">{selectedItem.cost_price || '-'}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  min="0.01"
                  step="0.01"
                />
                <FormField
                  label="Rate (SAR)"
                  name="rate"
                  type="number"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>

              <FormField
                label="Narration / Remarks"
                name="narration"
                type="textarea"
                value={formData.narration}
                onChange={handleChange}
                placeholder="Reason for adjustment..."
                rows={3}
              />

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <LoadingSpinner size="sm" color="text-white" />
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Adjustment
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
