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
import { Package, Plus, Pencil, Trash2 } from 'lucide-react';

export default function StockGroups() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    parent_group_id: ''
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['stockGroups'],
    queryFn: () => rcas.entities.StockGroup.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.StockGroup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockGroups'] });
      toast.success('Stock group created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.StockGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockGroups'] });
      toast.success('Stock group updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.StockGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockGroups'] });
      toast.success('Stock group deleted successfully');
    }
  });

  const openDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        name_arabic: group.name_arabic || '',
        parent_group_id: group.parent_group_id || ''
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        name_arabic: '',
        parent_group_id: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGroup(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: 'Group Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}
        </div>
      )
    },
    {
      header: 'Parent Group',
      accessor: 'parent_group_id',
      render: (row) => {
        const parent = groups.find(g => g.id === row.parent_group_id);
        return parent ? parent.name : 'Primary';
      }
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
              if (confirm('Are you sure you want to delete this group?')) {
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
    return <LoadingSpinner text="Loading stock groups..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Stock Groups" 
        subtitle="Manage your inventory categories"
        primaryAction={{ label: 'Add Group', onClick: () => openDialog() }}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Stock Groups"
          description="Create stock groups to organize your inventory"
          action={{ label: 'Add First Group', onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={groups} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Stock Group' : 'Create Stock Group'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField
                label="Group Name (English)"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                label="Group Name (Arabic)"
                name="name_arabic"
                value={formData.name_arabic}
                onChange={handleChange}
              />
              <FormField
                label="Parent Group"
                name="parent_group_id"
                type="select"
                value={formData.parent_group_id}
                onChange={handleChange}
                options={[
                  { value: '', label: 'None (Primary Group)' },
                  ...groups.filter(g => g.id !== editingGroup?.id).map(g => ({
                    value: g.id,
                    label: g.name
                  }))
                ]}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingGroup ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}