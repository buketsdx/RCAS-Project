import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '../context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck } from 'lucide-react';

export default function Suppliers() {
  const { type, selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
      case 'Restaurant':
        return {
          title: 'Vendors',
          subtitle: 'Manage your vendors and suppliers',
          entity: 'Vendor',
          add: 'Add Vendor',
          edit: 'Edit Vendor',
          noItems: 'No vendors found',
          start: 'Start by adding your first vendor'
        };
      default:
        return {
          title: 'Suppliers',
          subtitle: 'Manage your supplier list',
          entity: 'Supplier',
          add: 'Add Supplier',
          edit: 'Edit Supplier',
          noItems: 'No suppliers found',
          start: 'Start by adding your first supplier'
        };
    }
  };

  const terms = getTerminology();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierTypeFilter, setSupplierTypeFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    customer_type: 'General',
    vat_number: '',
    contact_person: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    bank_name: '',
    bank_account_number: '',
    iban: ''
  });

  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Filter suppliers - show all ledgers that have customer_type field
  const suppliers = ledgers.filter(l => {
    const hasSupplierType = l.customer_type === 'VAT Customer' || l.customer_type === 'General';
    if (supplierTypeFilter === 'All') return hasSupplierType;
    return hasSupplierType && l.customer_type === supplierTypeFilter;
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const ledgerData = {
        ...data,
        group_id: 'Sundry Creditors',
        is_active: true,
        company_id: selectedCompanyId
      };
      return rcas.entities.Ledger.create(ledgerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success(`${terms.entity} created successfully`);
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || `Failed to create ${terms.entity.toLowerCase()}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Ledger.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success(`${terms.entity} updated successfully`);
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || `Failed to update ${terms.entity.toLowerCase()}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Ledger.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success(`${terms.entity} deleted successfully`);
    },
    onError: (error) => {
      toast.error(error.message || `Failed to delete ${terms.entity.toLowerCase()}`);
    }
  });

  const openDialog = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name,
        customer_type: supplier.customer_type || 'General',
        vat_number: supplier.vat_number || '',
        contact_person: supplier.contact_person || '',
        address: supplier.address || '',
        city: supplier.city || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        bank_name: supplier.bank_name || '',
        bank_account_number: supplier.bank_account_number || '',
        iban: supplier.iban || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: '',
        customer_type: 'General',
        vat_number: '',
        contact_person: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        bank_name: '',
        bank_account_number: '',
        iban: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(`${terms.entity} name is required`);
      return;
    }

    const dataToSave = {
      name: formData.name,
      customer_type: formData.customer_type,
      vat_number: formData.vat_number || '',
      contact_person: formData.contact_person || '',
      address: formData.address || '',
      city: formData.city || '',
      phone: formData.phone || '',
      email: formData.email || '',
      bank_name: formData.bank_name || '',
      bank_account_number: formData.bank_account_number || '',
      iban: formData.iban || ''
    };

    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const columns = [
    {
      header: 'Supplier Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          {row.contact_person && <p className="text-xs text-slate-500">{row.contact_person}</p>}
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'customer_type',
      render: (row) => (
        <Badge className={row.customer_type === 'VAT Customer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
          {row.customer_type === 'VAT Customer' ? 'VAT Supplier' : 'General'}
        </Badge>
      )
    },
    {
      header: 'VAT Number',
      accessor: 'vat_number',
      render: (row) => row.vat_number || '-'
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (row) => (
        <div className="text-sm">
          {row.phone && <p>{row.phone}</p>}
          {row.email && <p className="text-slate-500">{row.email}</p>}
        </div>
      )
    },
    {
      header: 'City',
      accessor: 'city',
      render: (row) => row.city || '-'
    },
    {
      header: 'Bank Account',
      accessor: 'bank_account_number',
      render: (row) => row.bank_account_number || row.iban || '-'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDialog(row)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this supplier?')) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text={`Loading ${terms.entity.toLowerCase()}s...`} />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={terms.title}
        subtitle={terms.subtitle}
        icon={Truck}
      />

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{suppliers.length}</div>
                <p className="text-sm text-slate-600 mt-1">Total {terms.title}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{suppliers.filter(s => s.customer_type === 'VAT Customer').length}</div>
                <p className="text-sm text-slate-600 mt-1">VAT {terms.title}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-600">{suppliers.filter(s => s.customer_type !== 'VAT Customer').length}</div>
                <p className="text-sm text-slate-600 mt-1">General {terms.title}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{terms.entity} List</CardTitle>
              <Button
                onClick={() => openDialog()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                {terms.add}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm font-medium text-slate-700 block mb-2">Filter by Type</label>
              <div className="flex gap-2">
                {['All', 'VAT Customer', 'General'].map(type => (
                  <Button
                    key={type}
                    variant={supplierTypeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSupplierTypeFilter(type)}
                    className={supplierTypeFilter === type ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    {type === 'VAT Customer' ? `VAT ${terms.entity}` : type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {suppliers.length === 0 ? (
          <EmptyState
            title={terms.noItems}
            description={terms.start}
            icon={Truck}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={columns} data={suppliers} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? terms.edit : terms.add}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label={`${terms.entity} Name *`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={`Enter ${terms.entity.toLowerCase()} name`}
              required
            />
            <FormField
              label={`${terms.entity} Type`}
              name="customer_type"
              type="select"
              value={formData.customer_type}
              onChange={handleChange}
              options={[
                { value: 'VAT Customer', label: `VAT ${terms.entity}` },
                { value: 'General', label: 'General (Non-VAT)' }
              ]}
            />
            {formData.customer_type === 'VAT Customer' && (
              <FormField
                label="VAT Number"
                name="vat_number"
                value={formData.vat_number}
                onChange={handleChange}
                placeholder="VAT registration number"
              />
            )}
            <FormField
              label="Contact Person"
              name="contact_person"
              value={formData.contact_person}
              onChange={handleChange}
              placeholder="Name of contact person"
            />
            <FormField
              label="Address"
              name="address"
              type="textarea"
              value={formData.address}
              onChange={handleChange}
              placeholder="Supplier address"
              rows={2}
            />
            <FormField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City name"
            />
            <FormField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone number"
            />
            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
            />
            <FormField
              label="Bank Name"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleChange}
              placeholder="Bank name"
            />
            <FormField
              label="Bank Account Number"
              name="bank_account_number"
              value={formData.bank_account_number}
              onChange={handleChange}
              placeholder="Account number"
            />
            <FormField
              label="IBAN"
              name="iban"
              value={formData.iban}
              onChange={handleChange}
              placeholder="IBAN"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingSupplier ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
