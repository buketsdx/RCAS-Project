import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { initializeSystemLedgers } from '@/utils';
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
import { BookOpen, Plus, Pencil, Trash2 } from 'lucide-react';

export default function Ledgers() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    group_id: '',
    opening_balance: 0,
    opening_balance_type: 'Dr',
    contact_person: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    vat_number: '',
    credit_limit: '',
    credit_days: '',
    bank_name: '',
    bank_account_number: '',
    iban: ''
  });

  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ['ledgers'],
    queryFn: () => rcas.entities.Ledger.list()
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['accountGroups'],
    queryFn: () => rcas.entities.AccountGroup.list()
  });

  // Initialize system ledgers on component mount
  useEffect(() => {
    if (groups.length > 0) {
      initializeSystemLedgers(groups);
    }
  }, [groups]);

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.Ledger.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      toast.success('Ledger created successfully');
      closeDialog();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Ledger.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      toast.success('Ledger updated successfully');
      closeDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      // Prevent deletion of system ledgers
      const ledger = ledgers.find(l => l.id === id);
      if (ledger?.is_system) {
        throw new Error('Cannot delete system/inbuilt ledgers');
      }
      return rcas.entities.Ledger.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers'] });
      toast.success('Ledger deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Cannot delete this ledger');
    }
  });

  const openDialog = (ledger = null) => {
    if (ledger) {
      setEditingLedger(ledger);
      setFormData({
        name: ledger.name,
        name_arabic: ledger.name_arabic || '',
        group_id: ledger.group_id || '',
        opening_balance: ledger.opening_balance || 0,
        opening_balance_type: ledger.opening_balance_type || 'Dr',
        contact_person: ledger.contact_person || '',
        address: ledger.address || '',
        city: ledger.city || '',
        phone: ledger.phone || '',
        email: ledger.email || '',
        vat_number: ledger.vat_number || '',
        credit_limit: ledger.credit_limit || '',
        credit_days: ledger.credit_days || '',
        bank_name: ledger.bank_name || '',
        bank_account_number: ledger.bank_account_number || '',
        iban: ledger.iban || ''
      });
    } else {
      setEditingLedger(null);
      setFormData({
        name: '',
        name_arabic: '',
        group_id: '',
        opening_balance: 0,
        opening_balance_type: 'Dr',
        contact_person: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        vat_number: '',
        credit_limit: '',
        credit_days: '',
        bank_name: '',
        bank_account_number: '',
        iban: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingLedger(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      opening_balance: parseFloat(formData.opening_balance) || 0,
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      credit_days: formData.credit_days ? parseInt(formData.credit_days) : null
    };
    
    if (editingLedger) {
      updateMutation.mutate({ id: editingLedger.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const columns = [
    {
      header: 'Ledger Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}
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
      header: 'Opening Balance',
      accessor: 'opening_balance',
      render: (row) => (
        <span className={row.opening_balance_type === 'Dr' ? 'text-blue-600' : 'text-emerald-600'}>
          {parseFloat(row.opening_balance || 0).toFixed(2)} {row.opening_balance_type || ''}
        </span>
      )
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => row.phone || row.email || '-'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          {!row.is_system && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (confirm('Are you sure you want to delete this ledger?')) {
                  deleteMutation.mutate(row.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
          {row.is_system && (
            <Badge variant="outline" className="text-xs">System</Badge>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return <LoadingSpinner text="Loading ledgers..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Ledgers" 
        subtitle="Manage your accounting ledgers"
        primaryAction={{ label: 'Add Ledger', onClick: () => openDialog() }}
      />

      {ledgers.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Ledgers"
          description="Create ledgers to track your accounts"
          action={{ label: 'Add First Ledger', onClick: () => openDialog() }}
        />
      ) : (
        <DataTable columns={columns} data={ledgers} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLedger ? 'Edit Ledger' : 'Create Ledger'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Ledger Name (English)"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <FormField
                    label="Ledger Name (Arabic)"
                    name="name_arabic"
                    value={formData.name_arabic}
                    onChange={handleChange}
                  />
                </div>
                <FormField
                  label="Account Group"
                  name="group_id"
                  type="select"
                  value={formData.group_id}
                  onChange={handleChange}
                  required
                  options={groups.map(g => ({ value: g.id, label: g.name }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Opening Balance"
                    name="opening_balance"
                    type="number"
                    value={formData.opening_balance}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Balance Type"
                    name="opening_balance_type"
                    type="select"
                    value={formData.opening_balance_type}
                    onChange={handleChange}
                    options={[
                      { value: 'Dr', label: 'Debit (Dr)' },
                      { value: 'Cr', label: 'Credit (Cr)' }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Credit Limit (SAR)"
                    name="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Credit Days"
                    name="credit_days"
                    type="number"
                    value={formData.credit_days}
                    onChange={handleChange}
                  />
                </div>
                <FormField
                  label="VAT Number"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleChange}
                />
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <FormField
                  label="Contact Person"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                />
                <FormField
                  label="Address"
                  name="address"
                  type="textarea"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                />
                <FormField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </TabsContent>

              <TabsContent value="banking" className="space-y-4 mt-4">
                <FormField
                  label="Bank Name"
                  name="bank_name"
                  value={formData.bank_name}
                  onChange={handleChange}
                />
                <FormField
                  label="Bank Account Number"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                />
                <FormField
                  label="IBAN"
                  name="iban"
                  value={formData.iban}
                  onChange={handleChange}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                {editingLedger ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}