import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Flower2, Plus, Pencil, Trash2, AlertTriangle, TrendingDown, Upload } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const wasteReasons = ['Expired', 'Damaged', 'Wilted', 'Pest Infestation', 'Storage Issue', 'Transportation Damage', 'Customer Return', 'Other'];
const disposalMethods = ['Composting', 'Disposal', 'Donation', 'Recycling'];
const reasonColors = { 'Expired': '#ef4444', 'Damaged': '#f97316', 'Wilted': '#eab308', 'Pest Infestation': '#84cc16', 'Storage Issue': '#22c55e', 'Transportation Damage': '#06b6d4', 'Customer Return': '#3b82f6', 'Other': '#8b5cf6' };

export default function FlowerWasteTracker() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWaste, setEditingWaste] = useState(null);
  const [filters, setFilters] = useState({
    fromDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    toDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'), stock_item_id: '', stock_item_name: '', quantity: '', unit: 'Pcs',
    waste_reason: 'Wilted', cost_value: '', disposal_method: 'Composting', notes: '', image_url: ''
  });

  const { data: wasteRecords = [], isLoading } = useQuery({ queryKey: ['flowerWaste'], queryFn: () => base44.entities.FlowerWaste.list('-date') });
  const { data: stockItems = [] } = useQuery({ queryKey: ['stockItems'], queryFn: () => base44.entities.StockItem.list() });
  const { data: branches = [] } = useQuery({ queryKey: ['branches'], queryFn: () => base44.entities.Branch.list() });

  const filteredRecords = wasteRecords.filter(w => w.date >= filters.fromDate && w.date <= filters.toDate);
  const totalWasteQty = filteredRecords.reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0);
  const totalWasteValue = filteredRecords.reduce((sum, w) => sum + (parseFloat(w.cost_value) || 0), 0);

  const wasteByReason = wasteReasons.map(reason => ({
    name: reason,
    value: filteredRecords.filter(w => w.waste_reason === reason).reduce((sum, w) => sum + (parseFloat(w.quantity) || 0), 0)
  })).filter(r => r.value > 0);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const wasteId = await generateUniqueID('waste', ID_PREFIXES.WASTE);
      return base44.entities.FlowerWaste.create({ ...data, waste_id: wasteId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['flowerWaste'] }); toast.success('Waste record added'); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FlowerWaste.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['flowerWaste'] }); toast.success('Record updated'); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FlowerWaste.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['flowerWaste'] }); toast.success('Record deleted'); }
  });

  const openDialog = (waste = null) => {
    if (waste) { setEditingWaste(waste); setFormData({ ...waste }); }
    else { setEditingWaste(null); setFormData({ date: format(new Date(), 'yyyy-MM-dd'), stock_item_id: '', stock_item_name: '', quantity: '', unit: 'Pcs', waste_reason: 'Wilted', cost_value: '', disposal_method: 'Composting', notes: '', image_url: '' }); }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingWaste(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'stock_item_id') {
        const item = stockItems.find(i => i.id === value);
        if (item) { updated.stock_item_name = item.name; updated.cost_value = (parseFloat(updated.quantity) || 0) * (parseFloat(item.cost_price) || 0); }
      }
      if (name === 'quantity' && prev.stock_item_id) {
        const item = stockItems.find(i => i.id === prev.stock_item_id);
        if (item) updated.cost_value = (parseFloat(value) || 0) * (parseFloat(item.cost_price) || 0);
      }
      return updated;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success('Image uploaded');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, quantity: parseFloat(formData.quantity) || 0, cost_value: parseFloat(formData.cost_value) || 0 };
    if (editingWaste) updateMutation.mutate({ id: editingWaste.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'ID', accessor: 'waste_id', render: (row) => <span className="font-mono text-orange-600">{row.waste_id}</span> },
    { header: 'Date', accessor: 'date', render: (row) => row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-' },
    { header: 'Item', accessor: 'stock_item_name' },
    { header: 'Quantity', render: (row) => `${parseFloat(row.quantity || 0).toFixed(2)} ${row.unit || ''}` },
    { header: 'Reason', accessor: 'waste_reason', render: (row) => <Badge style={{ backgroundColor: reasonColors[row.waste_reason] + '20', color: reasonColors[row.waste_reason] }}>{row.waste_reason}</Badge> },
    { header: 'Value Loss', accessor: 'cost_value', render: (row) => <span className="text-red-600 font-medium">{parseFloat(row.cost_value || 0).toFixed(2)} SAR</span> },
    { header: 'Disposal', accessor: 'disposal_method' },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => openDialog(row)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )}
  ];

  if (isLoading) return <LoadingSpinner text="Loading waste records..." />;

  return (
    <div>
      <PageHeader title="Flower Waste Tracker" subtitle="Track and analyze flower wastage" primaryAction={{ label: 'Record Waste', onClick: () => openDialog() }} />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="From Date" name="fromDate" type="date" value={filters.fromDate} onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))} />
            <FormField label="To Date" name="toDate" type="date" value={filters.toDate} onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Records" value={filteredRecords.length} icon={Flower2} />
        <StatCard title="Total Quantity Lost" value={`${totalWasteQty.toFixed(2)}`} icon={AlertTriangle} />
        <StatCard title="Total Value Loss" value={`${totalWasteValue.toFixed(2)} SAR`} icon={TrendingDown} className="border-red-200" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Top Reason</p>
            <p className="text-lg font-bold">{wasteByReason[0]?.name || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Waste Records</CardTitle></CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <EmptyState icon={Flower2} title="No Waste Records" description="Record flower wastage to track losses" action={{ label: 'Record Waste', onClick: () => openDialog() }} />
            ) : (
              <DataTable columns={columns} data={filteredRecords} pageSize={5} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Waste by Reason</CardTitle></CardHeader>
          <CardContent>
            {wasteByReason.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={wasteByReason} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {wasteByReason.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={reasonColors[entry.name] || '#8884d8'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-slate-500 py-8">No data to display</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingWaste ? 'Edit' : 'Record'} Waste</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                <FormField label="Branch" name="branch_id" type="select" value={formData.branch_id} onChange={handleChange} options={[{ value: '', label: 'Select Branch' }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
              </div>
              <FormField label="Stock Item" name="stock_item_id" type="select" value={formData.stock_item_id} onChange={handleChange} required options={[{ value: '', label: 'Select Item' }, ...stockItems.map(i => ({ value: i.id, label: i.name }))]} />
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Quantity" name="quantity" type="number" value={formData.quantity} onChange={handleChange} required />
                <FormField label="Unit" name="unit" value={formData.unit} onChange={handleChange} />
                <FormField label="Value Loss (SAR)" name="cost_value" type="number" value={formData.cost_value} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Waste Reason" name="waste_reason" type="select" value={formData.waste_reason} onChange={handleChange} required options={wasteReasons.map(r => ({ value: r, label: r }))} />
                <FormField label="Disposal Method" name="disposal_method" type="select" value={formData.disposal_method} onChange={handleChange} options={disposalMethods.map(d => ({ value: d, label: d }))} />
              </div>
              <FormField label="Notes" name="notes" type="textarea" value={formData.notes} onChange={handleChange} rows={2} />
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo Evidence</label>
                <div className="flex items-center gap-4">
                  {formData.image_url && <img src={formData.image_url} alt="Waste" className="h-16 w-16 object-cover rounded-lg" />}
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Upload Photo
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">{editingWaste ? 'Update' : 'Record'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}