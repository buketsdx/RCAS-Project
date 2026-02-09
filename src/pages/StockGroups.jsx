import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import { useConfirm } from '@/context/ConfirmContext';
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
  const { company, selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Categories',
          subtitle: 'Manage service categories',
          add: 'Add Category',
          name: 'Category Name',
          parent: 'Parent Category',
          noItems: 'No Categories',
          noItemsDesc: 'Create categories to organize your services',
          addFirst: 'Add First Category',
          edit: 'Edit Category',
          create: 'Create Category'
        };
      case 'Restaurant':
        return {
          title: 'Menu Categories',
          subtitle: 'Manage menu categories',
          add: 'Add Menu Category',
          name: 'Category Name',
          parent: 'Parent Category',
          noItems: 'No Menu Categories',
          noItemsDesc: 'Create categories to organize your menu',
          addFirst: 'Add First Category',
          edit: 'Edit Menu Category',
          create: 'Create Menu Category'
        };
      default:
        return {
          title: 'Stock Groups',
          subtitle: 'Manage your inventory categories',
          add: 'Add Group',
          name: 'Group Name',
          parent: 'Parent Group',
          noItems: 'No Stock Groups',
          noItemsDesc: 'Create stock groups to organize your inventory',
          addFirst: 'Add First Group',
          edit: 'Edit Stock Group',
          create: 'Create Stock Group'
        };
    }
  };

  const terms = getTerminology();

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    parent_group_id: ''
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['stockGroups', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.StockGroup.list();
      return list.filter(g => String(g.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.StockGroup.create({ ...data, company_id: selectedCompanyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockGroups', selectedCompanyId] });
      toast.success('Stock group created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.StockGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockGroups', selectedCompanyId] });
      toast.success('Stock group updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.StockGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockGroups', selectedCompanyId] });
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
      header: terms.name,
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}
        </div>
      )
    },
    {
      header: terms.parent,
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
            onClick={async (e) => { 
              e.stopPropagation(); 
              if (await confirm({
                title: 'Delete Stock Group',
                description: 'Are you sure you want to delete this group? This action cannot be undone.',
                variant: 'destructive',
                confirmText: 'Delete'
              })) {
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
        title={terms.title}
        subtitle={terms.subtitle}
        primaryAction={{ label: terms.add, onClick: () => openDialog() }}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={Package}
          title={terms.noItems}
          description={terms.noItemsDesc}
          action={{ label: terms.addFirst, onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={groups} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? terms.edit : terms.create}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField
                label={`${terms.name} (English)`}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                label={`${terms.name} (Arabic)`}
                name="name_arabic"
                value={formData.name_arabic}
                onChange={handleChange}
              />
              <FormField
                label={terms.parent}
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
