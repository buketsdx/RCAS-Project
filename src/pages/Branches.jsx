import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
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
import { Building, Plus, Pencil, Trash2, Star } from 'lucide-react';

export default function Branches() {
  const queryClient = useQueryClient();
  const { selectedCompanyId, currentCompany } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '', name_arabic: '', address: '', city: '', phone: '', email: '', manager_name: '', is_head_office: false
  });

  const { data: branches = [], isLoading } = useQuery({ 
    queryKey: ['branches', selectedCompanyId],
    queryFn: async () => {
      const allBranches = await rcas.entities.Branch.list();
      return allBranches.filter(b => b.company_id === selectedCompanyId);
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const branchCode = await generateUniqueID('branch', ID_PREFIXES.BRANCH);
      return rcas.entities.Branch.create({ ...data, branch_code: branchCode, company_id: selectedCompanyId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches', selectedCompanyId] }); toast.success('Branch created'); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Branch.update(id, { ...data, company_id: selectedCompanyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches', selectedCompanyId] }); toast.success('Branch updated'); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Branch.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['branches', selectedCompanyId] }); toast.success('Branch deleted'); }
  });

  const openDialog = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({ ...branch });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', name_arabic: '', address: '', city: '', phone: '', email: '', manager_name: '', is_head_office: false });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingBranch(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBranch) updateMutation.mutate({ id: editingBranch.id, data: formData });
    else createMutation.mutate(formData);
  };

  const columns = [
    { header: 'Code', accessor: 'branch_code', render: (row) => <span className="font-mono text-emerald-600">{row.branch_code}</span> },
    { header: 'Name', accessor: 'name', render: (row) => (
      <div className="flex items-center gap-2">
        {row.is_head_office && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
        <div><p className="font-medium">{row.name}</p>{row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}</div>
      </div>
    )},
    { header: 'City', accessor: 'city' },
    { header: 'Manager', accessor: 'manager_name' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Status', render: (row) => <Badge className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{row.is_active !== false ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )}
  ];

  if (isLoading) return <LoadingSpinner text="Loading branches..." />;

  return (
    <div>
      <PageHeader 
        title="Branches" 
        subtitle={currentCompany ? `Branches for ${currentCompany.name}` : "Manage company branches"}
        primaryAction={{ label: 'Add Branch', onClick: () => openDialog() }} 
      />
      {branches.length === 0 ? (
        <EmptyState icon={Building} title="No Branches" description="Add branches to manage multiple locations" action={{ label: 'Add First Branch', onClick: () => openDialog() }} />
      ) : (
        <DataTable columns={columns} data={branches} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingBranch ? 'Edit' : 'Add'} Branch</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Name (English)" name="name" value={formData.name} onChange={handleChange} required />
                <FormField label="Name (Arabic)" name="name_arabic" value={formData.name_arabic} onChange={handleChange} />
              </div>
              <FormField label="Address" name="address" type="textarea" value={formData.address} onChange={handleChange} rows={2} />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City" name="city" value={formData.city} onChange={handleChange} />
                <FormField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                <FormField label="Manager Name" name="manager_name" value={formData.manager_name} onChange={handleChange} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_head_office" name="is_head_office" checked={formData.is_head_office} onChange={handleChange} className="rounded" />
                <label htmlFor="is_head_office" className="text-sm">This is the Head Office</label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editingBranch ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}