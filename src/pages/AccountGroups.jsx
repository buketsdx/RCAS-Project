import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';

const natureColors = {
  'Assets': 'bg-blue-100 text-blue-700',
  'Liabilities': 'bg-orange-100 text-orange-700',
  'Income': 'bg-emerald-100 text-emerald-700',
  'Expenses': 'bg-red-100 text-red-700',
  'Capital': 'bg-purple-100 text-purple-700'
};

export default function AccountGroups() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    parent_group_id: '',
    nature: '',
    affects_gross_profit: false
  });

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['accountGroups', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.AccountGroup.list();
      return list.filter(g => String(g.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.AccountGroup.create({ ...data, company_id: selectedCompanyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountGroups', selectedCompanyId] });
      toast.success('Account group created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.AccountGroup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountGroups', selectedCompanyId] });
      toast.success('Account group updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.AccountGroup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accountGroups', selectedCompanyId] });
      toast.success('Account group deleted successfully');
    }
  });

  const openDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        name_arabic: group.name_arabic || '',
        parent_group_id: group.parent_group_id || '',
        nature: group.nature,
        affects_gross_profit: group.affects_gross_profit || false
      });
    } else {
      setEditingGroup(null);
      setFormData({
        name: '',
        name_arabic: '',
        parent_group_id: '',
        nature: '',
        affects_gross_profit: false
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGroup(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
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
      header: 'Parent Group',
      accessor: 'parent_group_id',
      render: (row) => {
        const parent = groups.find(g => g.id === row.parent_group_id);
        return parent ? parent.name : '-';
      }
    },
    {
      header: 'Nature',
      accessor: 'nature',
      render: (row) => (
        <Badge className={natureColors[row.nature]}>{row.nature}</Badge>
      )
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
    return <LoadingSpinner text="Loading account groups..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Account Groups" 
        subtitle="Manage your chart of accounts structure"
        primaryAction={{ label: 'Add Group', onClick: () => openDialog() }}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No Account Groups"
          description="Create account groups to organize your ledgers"
          action={{ label: 'Add First Group', onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={groups} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Account Group' : 'Create Account Group'}</DialogTitle>
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
              <FormField
                label="Nature"
                name="nature"
                type="select"
                value={formData.nature}
                onChange={handleChange}
                required
                options={[
                  { value: 'Assets', label: 'Assets' },
                  { value: 'Liabilities', label: 'Liabilities' },
                  { value: 'Income', label: 'Income' },
                  { value: 'Expenses', label: 'Expenses' },
                  { value: 'Capital', label: 'Capital' }
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