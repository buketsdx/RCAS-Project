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
import { Ruler, Plus, Pencil, Trash2 } from 'lucide-react';

export default function Units() {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { company, selectedCompanyId } = useCompany();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Measurement Units',
          subtitle: 'Manage units for products and services',
          entity: 'Unit',
          create: 'Add Unit'
        };
      case 'Restaurant':
        return {
          title: 'Measurement Units',
          subtitle: 'Manage units for ingredients and menu items',
          entity: 'Unit',
          create: 'Add Unit'
        };
      default:
        return {
          title: 'Units of Measurement',
          subtitle: 'Manage units for inventory items',
          entity: 'Unit',
          create: 'Add Unit'
        };
    }
  };

  const terms = getTerminology();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    formal_name: '',
    is_simple: true,
    base_unit_id: '',
    conversion_factor: ''
  });

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Unit.list();
      return list.filter(u => String(u.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.Unit.create({ ...data, company_id: selectedCompanyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', selectedCompanyId] });
      toast.success('Unit created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Unit.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', selectedCompanyId] });
      toast.success('Unit updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Unit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units', selectedCompanyId] });
      toast.success('Unit deleted successfully');
    }
  });

  const openDialog = (unit = null) => {
    if (unit) {
      setEditingUnit(unit);
      setFormData({
        name: unit.name,
        formal_name: unit.formal_name || '',
        is_simple: unit.is_simple !== false,
        base_unit_id: unit.base_unit_id || '',
        conversion_factor: unit.conversion_factor || ''
      });
    } else {
      setEditingUnit(null);
      setFormData({
        name: '',
        formal_name: '',
        is_simple: true,
        base_unit_id: '',
        conversion_factor: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUnit(null);
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
    const dataToSave = {
      ...formData,
      conversion_factor: formData.conversion_factor ? parseFloat(formData.conversion_factor) : null
    };
    
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const columns = [
    {
      header: 'Symbol',
      accessor: 'name',
      render: (row) => (
        <span className="font-semibold text-slate-800">{row.name}</span>
      )
    },
    {
      header: 'Formal Name',
      accessor: 'formal_name'
    },
    {
      header: 'Type',
      accessor: 'is_simple',
      render: (row) => row.is_simple !== false ? 'Simple' : 'Compound'
    },
    {
      header: 'Conversion',
      render: (row) => {
        if (row.is_simple !== false || !row.base_unit_id) return '-';
        const baseUnit = units.find(u => u.id === row.base_unit_id);
        return `1 ${row.name} = ${row.conversion_factor} ${baseUnit?.name || ''}`;
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
                title: 'Delete Unit',
                description: 'Are you sure you want to delete this unit?',
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
    return <LoadingSpinner text="Loading units..." />;
  }

  return (
    <div>
      <PageHeader 
        title={terms.title} 
        subtitle={terms.subtitle}
        primaryAction={{ label: terms.create, onClick: () => openDialog() }}
      />

      {units.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title={`No ${terms.entity}s`}
          description={`Create ${terms.entity.toLowerCase()}s of measurement`}
          action={{ label: `Add First ${terms.entity}`, onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={units} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? `Edit ${terms.entity}` : `Create ${terms.entity}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField
                label="Symbol"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Pcs, Kg, Box"
              />
              <FormField
                label="Formal Name"
                name="formal_name"
                value={formData.formal_name}
                onChange={handleChange}
                placeholder="e.g., Pieces, Kilograms, Boxes"
              />
              <FormField
                label="Unit Type"
                name="is_simple"
                type="select"
                value={formData.is_simple ? 'true' : 'false'}
                onChange={(e) => handleChange({ target: { name: 'is_simple', value: e.target.value === 'true' }})}
                options={[
                  { value: 'true', label: 'Simple Unit' },
                  { value: 'false', label: 'Compound Unit' }
                ]}
              />
              {!formData.is_simple && (
                <>
                  <FormField
                    label="Base Unit"
                    name="base_unit_id"
                    type="select"
                    value={formData.base_unit_id}
                    onChange={handleChange}
                    options={units.filter(u => u.id !== editingUnit?.id && u.is_simple !== false).map(u => ({
                      value: u.id,
                      label: u.name
                    }))}
                  />
                  <FormField
                    label="Conversion Factor"
                    name="conversion_factor"
                    type="number"
                    value={formData.conversion_factor}
                    onChange={handleChange}
                    hint="How many base units in this unit"
                  />
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingUnit ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
