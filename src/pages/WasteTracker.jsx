import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatCard from '@/components/common/StatCard';
import { generateUniqueID, ID_PREFIXES } from '@/components/common/IDGenerator';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Trash2, Plus, Pencil, AlertTriangle, TrendingDown, Upload, Recycle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const wasteTypes = ['Paper', 'Plastic', 'E-Waste', 'Organic', 'Metal', 'Glass', 'Hazardous', 'Other'];
const wasteReasons = ['Expired', 'Damaged', 'Obsolescence', 'Production Defect', 'Storage Issue', 'Transportation Damage', 'Customer Return', 'Other'];
const disposalMethods = ['Recycling', 'Landfill', 'Incineration', 'Donation', 'Return to Vendor', 'Composting'];

const typeColors = {
  'Paper': '#f59e0b', 'Plastic': '#3b82f6', 'E-Waste': '#ef4444', 'Organic': '#22c55e', 
  'Metal': '#64748b', 'Glass': '#06b6d4', 'Hazardous': '#7c3aed', 'Other': '#9ca3af'
};

export default function WasteTracker() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWaste, setEditingWaste] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    waste_type: 'Other',
    stock_item_id: '',
    stock_item_name: '',
    quantity: '',
    unit: 'Pcs',
    waste_reason: 'Damaged',
    cost_value: '',
    disposal_method: 'Recycling',
    vendor_name: '',
    notes: '',
    image_url: ''
  });

  const { data: wasteRecords = [], isLoading } = useQuery({ 
    queryKey: ['wasteRecords'], 
    queryFn: () => base44.entities.WasteRecord.list('-date') 
  });
  const { data: stockItems = [] } = useQuery({ 
    queryKey: ['stockItems'], 
    queryFn: () => base44.entities.StockItem.list() 
  });

  const filteredRecords = wasteRecords.filter(w => w.date >= filters.fromDate && w.date <= filters.toDate);
  const totalWasteQty = filteredRecords.reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0);
  const totalWasteValue = filteredRecords.reduce((sum, w) => sum + (parseFloat(w.cost_value) || 0), 0);

  const wasteByType = wasteTypes.map(type => ({
    name: type,
    value: filteredRecords.filter(w => w.waste_type === type).reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0)
  })).filter(r => r.value > 0);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const wasteId = await generateUniqueID('waste', ID_PREFIXES.WASTE);
      return base44.entities.WasteRecord.create({ ...data, waste_id: wasteId });
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['wasteRecords'] }); 
      toast.success('Waste record added'); 
      closeDialog(); 
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WasteRecord.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['wasteRecords'] }); 
      toast.success('Record updated'); 
      closeDialog(); 
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WasteRecord.delete(id),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['wasteRecords'] }); 
      toast.success('Record deleted'); 
    }
  });

  const openDialog = (waste = null) => {
    if (waste) { 
      setEditingWaste(waste); 
      setFormData({ ...waste }); 
    } else { 
      setEditingWaste(null); 
      setFormData({ 
        date: format(new Date(), 'yyyy-MM-dd'), 
        waste_type: 'Other',
        stock_item_id: '', 
        stock_item_name: '', 
        quantity: '', 
        unit: 'Pcs', 
        waste_reason: 'Damaged', 
        cost_value: '', 
        disposal_method: 'Recycling', 
        vendor_name: '',
        notes: '', 
        image_url: '' 
      }); 
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingWaste(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'stock_item_id') {
        const item = stockItems.find(i => i.id === value);
        if (item) { 
          updated.stock_item_name = item.name; 
          updated.unit = item.unit || 'Pcs';
          updated.cost_value = (parseFloat(updated.quantity) || 0) * (parseFloat(item.cost_price) || 0); 
        }
      }
      if (name === 'quantity' && prev.stock_item_id) {
        const item = stockItems.find(i => i.id === prev.stock_item_id);
        if (item) updated.cost_value = (parseFloat(value) || 0) * (parseFloat(item.cost_price) || 0);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWaste) {
      updateMutation.mutate({ id: editingWaste.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    { header: 'Date', accessor: 'date', sortable: true },
    { header: 'Type', accessor: 'waste_type', render: (row) => <Badge variant="outline" style={{borderColor: typeColors[row.waste_type], color: typeColors[row.waste_type]}}>{row.waste_type}</Badge> },
    { header: 'Item / Description', accessor: 'stock_item_name', render: (row) => row.stock_item_name || row.notes },
    { header: 'Reason', accessor: 'waste_reason' },
    { header: 'Quantity', accessor: 'quantity', render: (row) => `${row.quantity} ${row.unit}` },
    { header: 'Cost Value', accessor: 'cost_value', render: (row) => formatCurrency(row.cost_value) },
    { header: 'Method', accessor: 'disposal_method' },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => openDialog(row)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteMutation.mutate(row.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Waste Tracker" 
        subtitle="Track waste, disposal costs, and environmental compliance"
        actions={<Button onClick={() => openDialog()}><Plus className="mr-2 h-4 w-4" /> Log Waste</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Waste Volume" value={`${totalWasteQty.toFixed(2)}`} icon={<Recycle className="h-6 w-6" />} trend="neutral" />
        <StatCard title="Total Waste Cost" value={formatCurrency(totalWasteValue)} icon={<TrendingDown className="h-6 w-6 text-red-500" />} trend="negative" />
        
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Waste by Type</CardTitle></CardHeader>
          <CardContent className="h-[120px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={wasteByType} cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2} dataKey="value">
                  {wasteByType.map((entry, index) => <Cell key={`cell-${index}`} fill={typeColors[entry.name] || '#8884d8'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Waste Records</CardTitle>
          <div className="flex gap-2">
            <input type="date" value={filters.fromDate} onChange={e => setFilters(prev => ({...prev, fromDate: e.target.value}))} className="border rounded p-1 text-sm" />
            <span className="self-center">-</span>
            <input type="date" value={filters.toDate} onChange={e => setFilters(prev => ({...prev, toDate: e.target.value}))} className="border rounded p-1 text-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={filteredRecords} 
            columns={columns} 
            isLoading={isLoading}
            emptyState={<EmptyState title="No waste records found" description="Log waste to start tracking environmental impact." icon={<Recycle className="h-12 w-12 text-slate-300" />} />} 
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingWaste ? 'Edit Waste Record' : 'Log New Waste'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
              <FormField label="Waste Type" name="waste_type" type="select" options={wasteTypes} value={formData.waste_type} onChange={handleChange} required />
              
              <FormField label="Stock Item (Optional)" name="stock_item_id" type="select" 
                options={[{value: '', label: 'None'}, ...stockItems.map(i => ({ value: i.id, label: i.name }))]} 
                value={formData.stock_item_id} onChange={handleChange} 
              />
              <FormField label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
              
              <FormField label="Reason" name="waste_reason" type="select" options={wasteReasons} value={formData.waste_reason} onChange={handleChange} required />
              <FormField label="Cost Value (SAR)" name="cost_value" type="number" value={formData.cost_value} onChange={handleChange} />
              
              <FormField label="Disposal Method" name="disposal_method" type="select" options={disposalMethods} value={formData.disposal_method} onChange={handleChange} />
              <FormField label="Vendor / Recycler" name="vendor_name" value={formData.vendor_name} onChange={handleChange} placeholder="e.g. MWAN Service Provider" />
            </div>
            <FormField label="Notes" name="notes" type="textarea" value={formData.notes} onChange={handleChange} placeholder="Details about the waste..." />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
