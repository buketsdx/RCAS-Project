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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, Plus, Pencil, Trash2 } from 'lucide-react';

export default function VoucherTypes() {
  const queryClient = useQueryClient();
  const { company, selectedCompanyId } = useCompany();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Transaction Types',
          subtitle: 'Configure invoice and receipt numbering',
          entity: 'Transaction Type',
          create: 'Add Type'
        };
      case 'Restaurant':
        return {
          title: 'Order Types',
          subtitle: 'Configure order and bill numbering',
          entity: 'Order Type',
          create: 'Add Type'
        };
      default:
        return {
          title: 'Voucher Types',
          subtitle: 'Customize voucher numbering and types',
          entity: 'Voucher Type',
          create: 'Add Type'
        };
    }
  };

  const terms = getTerminology();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parent_type: '',
    abbreviation: '',
    numbering_method: 'Automatic',
    starting_number: 1,
    prefix: '',
    suffix: ''
  });

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['voucherTypes', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.VoucherType.list();
      return list.filter(t => String(t.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.VoucherType.create({ ...data, company_id: selectedCompanyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voucherTypes', selectedCompanyId] });
      toast.success(`${terms.entity} created`);
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.VoucherType.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voucherTypes', selectedCompanyId] });
      toast.success(`${terms.entity} updated`);
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.VoucherType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voucherTypes', selectedCompanyId] });
      toast.success(`${terms.entity} deleted`);
    }
  });

  const openDialog = (type = null) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        parent_type: type.parent_type,
        abbreviation: type.abbreviation || '',
        numbering_method: type.numbering_method || 'Automatic',
        starting_number: type.starting_number || 1,
        prefix: type.prefix || '',
        suffix: type.suffix || ''
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', parent_type: '', abbreviation: '', numbering_method: 'Automatic', starting_number: 1, prefix: '', suffix: '' });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingType(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData, starting_number: parseInt(formData.starting_number) || 1 };
    if (editingType) updateMutation.mutate({ id: editingType.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'Name', accessor: 'name', render: (row) => <span className="font-medium">{row.name}</span> },
    { header: 'Parent Type', accessor: 'parent_type', render: (row) => <Badge variant="outline">{row.parent_type}</Badge> },
    { header: 'Abbreviation', accessor: 'abbreviation' },
    { header: 'Numbering', accessor: 'numbering_method' },
    { header: 'Format', render: (row) => `${row.prefix || ''}[No]${row.suffix || ''}` },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text={`Loading ${terms.entity.toLowerCase()}s...`} />;

  return (
    <div>
      <PageHeader title={terms.title} subtitle={terms.subtitle} primaryAction={{ label: terms.create, onClick: () => openDialog() }} />
      {types.length === 0 ? (
        <EmptyState icon={FileText} title={`No ${terms.entity}s`} description={`Create custom ${terms.entity.toLowerCase()}s`} action={{ label: 'Add First', onClick: () => openDialog() }} />
      ) : (
        <DataTable columns={columns} data={types} />
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingType ? 'Edit' : 'Create'} {terms.entity}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="space-y-5 py-4 px-0.5">
              <FormField label="Name *" name="name" value={formData.name} onChange={handleChange} required />
              <FormField label="Parent Type *" name="parent_type" type="select" value={formData.parent_type} onChange={handleChange} required options={[
                { value: 'Sales', label: 'Sales' },
                { value: 'Purchase', label: 'Purchase' },
                { value: 'Receipt', label: 'Receipt' },
                { value: 'Payment', label: 'Payment' },
                { value: 'Contra', label: 'Contra' },
                { value: 'Journal', label: 'Journal' },
                { value: 'Credit Note', label: 'Credit Note' },
                { value: 'Debit Note', label: 'Debit Note' }
              ]} />
              <FormField label="Abbreviation" name="abbreviation" value={formData.abbreviation} onChange={handleChange} />
              <FormField label="Numbering Method" name="numbering_method" type="select" value={formData.numbering_method} onChange={handleChange} options={[{ value: 'Automatic', label: 'Automatic' }, { value: 'Manual', label: 'Manual' }]} />
              <div className="grid grid-cols-3 gap-4">
                <FormField label="Prefix" name="prefix" value={formData.prefix} onChange={handleChange} />
                <FormField label="Start No" name="starting_number" type="number" value={formData.starting_number} onChange={handleChange} />
                <FormField label="Suffix" name="suffix" value={formData.suffix} onChange={handleChange} />
              </div>
            </div>
          </form>
          <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>{editingType ? 'Update' : 'Create'}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}