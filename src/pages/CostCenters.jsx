import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calculator, Plus, Pencil, Trash2 } from 'lucide-react';

export default function CostCenters() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    parent_id: '',
    category: ''
  });

  const { data: centers = [], isLoading } = useQuery({
    queryKey: ['costCenters'],
    queryFn: () => rcas.entities.CostCenter.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.CostCenter.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast.success('Cost center created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.CostCenter.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast.success('Cost center updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.CostCenter.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costCenters'] });
      toast.success('Cost center deleted successfully');
    }
  });

  const openDialog = (center = null) => {
    if (center) {
      setEditingCenter(center);
      setFormData({
        name: center.name,
        name_arabic: center.name_arabic || '',
        parent_id: center.parent_id || '',
        category: center.category || ''
      });
    } else {
      setEditingCenter(null);
      setFormData({ name: '', name_arabic: '', parent_id: '', category: '' });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCenter(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}
        </div>
      )
    },
    {
      header: 'Parent',
      accessor: 'parent_id',
      render: (row) => {
        const parent = centers.find(c => c.id === row.parent_id);
        return parent ? parent.name : '-';
      }
    },
    {
      header: 'Category',
      accessor: 'category'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteMutation.mutate(row.id); }}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading cost centers..." />;

  return (
    <div>
      <PageHeader title="Cost Centers" subtitle="Manage cost centers for allocation" primaryAction={{ label: 'Add Cost Center', onClick: () => openDialog() }} />
      {centers.length === 0 ? (
        <EmptyState icon={Calculator} title="No Cost Centers" description="Create cost centers for cost allocation" action={{ label: 'Add First', onClick: () => openDialog() }} />
      ) : (
        <DataTable columns={columns} data={centers} />
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingCenter ? 'Edit' : 'Create'} Cost Center</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField label="Name (English)" name="name" value={formData.name} onChange={handleChange} required />
              <FormField label="Name (Arabic)" name="name_arabic" value={formData.name_arabic} onChange={handleChange} />
              <FormField label="Parent" name="parent_id" type="select" value={formData.parent_id} onChange={handleChange} options={[{ value: '', label: 'None' }, ...centers.filter(c => c.id !== editingCenter?.id).map(c => ({ value: c.id, label: c.name }))]} />
              <FormField label="Category" name="category" value={formData.category} onChange={handleChange} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editingCenter ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}