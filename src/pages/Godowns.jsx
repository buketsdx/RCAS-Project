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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Warehouse, Plus, Pencil, Trash2 } from 'lucide-react';

export default function Godowns() {
  const queryClient = useQueryClient();
  const { company, selectedCompanyId } = useCompany();
  const { confirm } = useConfirm();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
      case 'Restaurant':
        return {
          title: 'Stores / Locations',
          subtitle: 'Manage your inventory storage locations',
          entity: 'Store',
          create: 'Add Store'
        };
      default:
        return {
          title: 'Godowns / Warehouses',
          subtitle: 'Manage your storage locations',
          entity: 'Godown',
          create: 'Add Godown'
        };
    }
  };

  const terms = getTerminology();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGodown, setEditingGodown] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    parent_godown_id: '',
    address: '',
    contact_person: '',
    phone: '',
    is_active: true
  });

  const { data: godowns = [], isLoading } = useQuery({
    queryKey: ['godowns', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Godown.list();
      return list.filter(g => String(g.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.Godown.create({ ...data, company_id: selectedCompanyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['godowns', selectedCompanyId] });
      toast.success(`${terms.entity} created successfully`);
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Godown.update(id, { ...data, company_id: selectedCompanyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['godowns', selectedCompanyId] });
      toast.success(`${terms.entity} updated successfully`);
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Godown.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['godowns', selectedCompanyId] });
      toast.success(`${terms.entity} deleted successfully`);
    }
  });

  const openDialog = (godown = null) => {
    if (godown) {
      setEditingGodown(godown);
      setFormData({
        name: godown.name,
        name_arabic: godown.name_arabic || '',
        parent_godown_id: godown.parent_godown_id || '',
        address: godown.address || '',
        contact_person: godown.contact_person || '',
        phone: godown.phone || '',
        is_active: godown.is_active !== false
      });
    } else {
      setEditingGodown(null);
      setFormData({
        name: '',
        name_arabic: '',
        parent_godown_id: '',
        address: '',
        contact_person: '',
        phone: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingGodown(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingGodown) {
      updateMutation.mutate({ id: editingGodown.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: `${terms.entity} Name`,
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
      accessor: 'parent_godown_id',
      render: (row) => {
        const parent = godowns.find(g => g.id === row.parent_godown_id);
        return parent ? parent.name : 'Main';
      }
    },
    {
      header: 'Address',
      accessor: 'address'
    },
    {
      header: 'Contact',
      accessor: 'contact_person',
      render: (row) => (
        <div>
          <p className="text-sm">{row.contact_person || '-'}</p>
          {row.phone && <p className="text-xs text-slate-500">{row.phone}</p>}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'is_active',
      render: (row) => (
        <Badge className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
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
            onClick={async (e) => { 
              e.stopPropagation(); 
              if (await confirm({
                title: `Delete ${terms.entity}`,
                description: `Are you sure you want to delete this ${terms.entity.toLowerCase()}?`,
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
    return <LoadingSpinner text={`Loading ${terms.entity.toLowerCase()}s...`} />;
  }

  return (
    <div>
      <PageHeader 
        title={terms.title} 
        subtitle={terms.subtitle}
        primaryAction={{ label: terms.create, onClick: () => openDialog() }}
      />

      {godowns.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title={`No ${terms.entity}s`}
          description={`Create ${terms.entity.toLowerCase()}s to manage your storage locations`}
          action={{ label: `Add First ${terms.entity}`, onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={godowns} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGodown ? `Edit ${terms.entity}` : `Create ${terms.entity}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField
                label={`${terms.entity} Name (English)`}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <FormField
                label={`${terms.entity} Name (Arabic)`}
                name="name_arabic"
                value={formData.name_arabic}
                onChange={handleChange}
              />
              <FormField
                label={`Parent ${terms.entity}`}
                name="parent_godown_id"
                type="select"
                value={formData.parent_godown_id}
                onChange={handleChange}
                options={[
                  { value: '', label: `None (Main ${terms.entity})` },
                  ...godowns.filter(g => g.id !== editingGodown?.id).map(g => ({
                    value: g.id,
                    label: g.name
                  }))
                ]}
              />
              <FormField
                label="Address"
                name="address"
                type="textarea"
                value={formData.address}
                onChange={handleChange}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Contact Person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                />
                <FormField
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingGodown ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
