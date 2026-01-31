import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Package, Plus, Pencil, Trash2, Upload } from 'lucide-react';

export default function StockItems() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    alias: '',
    part_number: '',
    barcode: '',
    group_id: '',
    unit_id: '',
    opening_qty: 0,
    opening_rate: 0,
    cost_price: '',
    selling_price: '',
    mrp: '',
    reorder_level: '',
    vat_rate: 15,
    hsn_code: '',
    description: '',
    image_url: ''
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['stockItems'],
    queryFn: () => rcas.entities.StockItem.list()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['stockGroups'],
    queryFn: () => rcas.entities.StockGroup.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => rcas.entities.Unit.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.StockItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockItems'] });
      toast.success('Stock item created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.StockItem.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockItems'] });
      toast.success('Stock item updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.StockItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockItems'] });
      toast.success('Stock item deleted successfully');
    }
  });

  const openDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        name_arabic: item.name_arabic || '',
        alias: item.alias || '',
        part_number: item.part_number || '',
        barcode: item.barcode || '',
        group_id: item.group_id || '',
        unit_id: item.unit_id || '',
        opening_qty: item.opening_qty || 0,
        opening_rate: item.opening_rate || 0,
        cost_price: item.cost_price || '',
        selling_price: item.selling_price || '',
        mrp: item.mrp || '',
        reorder_level: item.reorder_level || '',
        vat_rate: item.vat_rate || 15,
        hsn_code: item.hsn_code || '',
        description: item.description || '',
        image_url: item.image_url || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        name_arabic: '',
        alias: '',
        part_number: '',
        barcode: '',
        group_id: '',
        unit_id: '',
        opening_qty: 0,
        opening_rate: 0,
        cost_price: '',
        selling_price: '',
        mrp: '',
        reorder_level: '',
        vat_rate: 15,
        hsn_code: '',
        description: '',
        image_url: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await rcas.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success('Image uploaded successfully');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      opening_qty: parseFloat(formData.opening_qty) || 0,
      opening_rate: parseFloat(formData.opening_rate) || 0,
      opening_value: (parseFloat(formData.opening_qty) || 0) * (parseFloat(formData.opening_rate) || 0),
      current_qty: parseFloat(formData.opening_qty) || 0,
      current_value: (parseFloat(formData.opening_qty) || 0) * (parseFloat(formData.opening_rate) || 0),
      cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
      selling_price: formData.selling_price ? parseFloat(formData.selling_price) : null,
      mrp: formData.mrp ? parseFloat(formData.mrp) : null,
      reorder_level: formData.reorder_level ? parseFloat(formData.reorder_level) : null,
      vat_rate: parseFloat(formData.vat_rate) || 15
    };
    
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const columns = [
    {
      header: 'Item',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            <img src={row.image_url} alt={row.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div>
            <p className="font-medium text-slate-800">{row.name}</p>
            {row.part_number && <p className="text-xs text-slate-500">#{row.part_number}</p>}
          </div>
        </div>
      )
    },
    {
      header: 'Group',
      accessor: 'group_id',
      render: (row) => {
        const group = groups.find(g => g.id === row.group_id);
        return group ? <Badge variant="outline">{group.name}</Badge> : '-';
      }
    },
    {
      header: 'Current Stock',
      accessor: 'current_qty',
      render: (row) => {
        const unit = units.find(u => u.id === row.unit_id);
        return `${parseFloat(row.current_qty || 0).toFixed(2)} ${unit?.name || ''}`;
      }
    },
    {
      header: 'Selling Price',
      accessor: 'selling_price',
      render: (row) => row.selling_price ? formatCurrency(parseFloat(row.selling_price), 'SAR') : '-'
    },
    {
      header: 'VAT',
      accessor: 'vat_rate',
      render: (row) => `${row.vat_rate || 15}%`
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Are you sure you want to delete this item?')) {
                deleteMutation.mutate(row.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return <LoadingSpinner text="Loading stock items..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Stock Items" 
        subtitle="Manage your inventory items"
        primaryAction={{ label: 'Add Item', onClick: () => openDialog() }}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Stock Items"
          description="Create stock items to manage your inventory"
          action={{ label: 'Add First Item', onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={items} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Stock Item' : 'Create Stock Item'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="tax">Tax</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Item Name (English)"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    label="Item Name (Arabic)"
                    name="name_arabic"
                    value={formData.name_arabic}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    label="Alias"
                    name="alias"
                    value={formData.alias}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Part Number"
                    name="part_number"
                    value={formData.part_number}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Barcode"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Stock Group"
                    name="group_id"
                    type="select"
                    value={formData.group_id}
                    onChange={handleChange}
                    options={groups.map(g => ({ value: g.id, label: g.name }))}
                  />
                  <FormField
                    label="Unit"
                    name="unit_id"
                    type="select"
                    value={formData.unit_id}
                    onChange={handleChange}
                    required
                    options={units.map(u => ({ value: u.id, label: u.name }))}
                  />
                </div>
                <FormField
                  label="Description"
                  name="description"
                  type="textarea"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Item Image</label>
                  <div className="flex items-center gap-4">
                    {formData.image_url && (
                      <img 
                        src={formData.image_url} 
                        alt="Item" 
                        className="h-16 w-16 object-cover rounded-lg border border-slate-200"
                      />
                    )}
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Upload Image</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="stock" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Opening Quantity"
                    name="opening_qty"
                    type="number"
                    value={formData.opening_qty}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Opening Rate (SAR)"
                    name="opening_rate"
                    type="number"
                    value={formData.opening_rate}
                    onChange={handleChange}
                  />
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">Opening Value:</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {((parseFloat(formData.opening_qty) || 0) * (parseFloat(formData.opening_rate) || 0)).toFixed(2)} SAR
                  </p>
                </div>
                <FormField
                  label="Reorder Level"
                  name="reorder_level"
                  type="number"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  hint="Minimum quantity to trigger reorder alert"
                />
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    label="Cost Price (SAR)"
                    name="cost_price"
                    type="number"
                    value={formData.cost_price}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Selling Price (SAR)"
                    name="selling_price"
                    type="number"
                    value={formData.selling_price}
                    onChange={handleChange}
                  />
                  <FormField
                    label="MRP (SAR)"
                    name="mrp"
                    type="number"
                    value={formData.mrp}
                    onChange={handleChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="tax" className="space-y-4 mt-4">
                <FormField
                  label="VAT Rate (%)"
                  name="vat_rate"
                  type="select"
                  value={formData.vat_rate}
                  onChange={handleChange}
                  options={[
                    { value: '15', label: '15% (Standard Rate)' },
                    { value: '0', label: '0% (Zero Rated)' },
                    { value: '5', label: '5%' }
                  ]}
                />
                <FormField
                  label="HSN/SAC Code"
                  name="hsn_code"
                  value={formData.hsn_code}
                  onChange={handleChange}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}