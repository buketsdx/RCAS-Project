import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { generateUniqueID, ID_PREFIXES } from '@/components/common/IDGenerator';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, Plus, Pencil, Trash2 } from 'lucide-react';

const calculationTypes = [
  { value: 'Fixed', label: 'Fixed Amount' },
  { value: 'Percentage of Basic', label: 'Percentage of Basic' },
  { value: 'Percentage of Gross', label: 'Percentage of Gross' },
  { value: 'Formula', label: 'Custom Formula' },
  { value: 'Days Based', label: 'Days Based' }
];

export default function SalaryComponents() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [formData, setFormData] = useState({
    name: '', name_arabic: '', type: 'Earning', calculation_type: 'Fixed',
    default_value: '', percentage: '', formula: '', is_taxable: false, affects_gosi: false, is_mandatory: false
  });

  const { data: components = [], isLoading } = useQuery({ queryKey: ['salaryComponents'], queryFn: () => base44.entities.SalaryComponent.list() });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const componentId = await generateUniqueID('salary_component', ID_PREFIXES.SALARY_COMP);
      return base44.entities.SalaryComponent.create({ ...data, component_id: componentId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaryComponents'] }); toast.success('Component created'); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SalaryComponent.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaryComponents'] }); toast.success('Component updated'); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SalaryComponent.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['salaryComponents'] }); toast.success('Component deleted'); }
  });

  const openDialog = (component = null) => {
    if (component) { setEditingComponent(component); setFormData({ ...component }); }
    else { setEditingComponent(null); setFormData({ name: '', name_arabic: '', type: 'Earning', calculation_type: 'Fixed', default_value: '', percentage: '', formula: '', is_taxable: false, affects_gosi: false, is_mandatory: false }); }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingComponent(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      default_value: parseFloat(formData.default_value) || 0,
      percentage: parseFloat(formData.percentage) || 0
    };
    if (editingComponent) updateMutation.mutate({ id: editingComponent.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'ID', accessor: 'component_id', render: (row) => <span className="font-mono text-blue-600">{row.component_id}</span> },
    { header: 'Name', accessor: 'name', render: (row) => <div><p className="font-medium">{row.name}</p>{row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}</div> },
    { header: 'Type', accessor: 'type', render: (row) => <Badge className={row.type === 'Earning' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{row.type}</Badge> },
    { header: 'Calculation', accessor: 'calculation_type' },
    { header: 'Value/Rate', render: (row) => row.calculation_type === 'Fixed' ? `${parseFloat(row.default_value || 0).toFixed(2)} SAR` : row.percentage ? `${row.percentage}%` : '-' },
    { header: 'GOSI', render: (row) => row.affects_gosi ? <Badge className="bg-blue-100 text-blue-700">Yes</Badge> : '-' },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => openDialog(row)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )}
  ];

  if (isLoading) return <LoadingSpinner text="Loading salary components..." />;

  return (
    <div>
      <PageHeader title="Salary Components" subtitle="Define earnings and deductions" primaryAction={{ label: 'Add Component', onClick: () => openDialog() }} />

      {components.length === 0 ? (
        <EmptyState icon={Calculator} title="No Salary Components" description="Create salary components for custom payroll" action={{ label: 'Add Component', onClick: () => openDialog() }} />
      ) : (
        <DataTable columns={columns} data={components} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingComponent ? 'Edit' : 'Create'} Salary Component</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Name (English)" name="name" value={formData.name} onChange={handleChange} required />
                <FormField label="Name (Arabic)" name="name_arabic" value={formData.name_arabic} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type" name="type" type="select" value={formData.type} onChange={handleChange} required options={[{ value: 'Earning', label: 'Earning (+)' }, { value: 'Deduction', label: 'Deduction (-)' }]} />
                <FormField label="Calculation Type" name="calculation_type" type="select" value={formData.calculation_type} onChange={handleChange} required options={calculationTypes} />
              </div>
              {formData.calculation_type === 'Fixed' && (
                <FormField label="Default Amount (SAR)" name="default_value" type="number" value={formData.default_value} onChange={handleChange} />
              )}
              {(formData.calculation_type === 'Percentage of Basic' || formData.calculation_type === 'Percentage of Gross') && (
                <FormField label="Percentage (%)" name="percentage" type="number" value={formData.percentage} onChange={handleChange} />
              )}
              {formData.calculation_type === 'Formula' && (
                <FormField label="Formula" name="formula" value={formData.formula} onChange={handleChange} placeholder="e.g. basic * 0.1 + 500" hint="Use: basic, gross, days_worked, overtime_hours" />
              )}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="affects_gosi" name="affects_gosi" checked={formData.affects_gosi} onChange={handleChange} className="rounded" />
                  <label htmlFor="affects_gosi" className="text-sm">Affects GOSI Calculation</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is_mandatory" name="is_mandatory" checked={formData.is_mandatory} onChange={handleChange} className="rounded" />
                  <label htmlFor="is_mandatory" className="text-sm">Mandatory for all employees</label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">{editingComponent ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}