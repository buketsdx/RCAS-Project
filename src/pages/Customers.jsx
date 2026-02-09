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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

export default function Customers() {
  const { confirm } = useConfirm();
  const { company, selectedCompanyId } = useCompany();
  const type = company?.type || 'General';

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Clients',
          subtitle: 'Manage your client list',
          customer: 'Client',
          add: 'Add Client',
          edit: 'Edit Client',
          total: 'Total Clients',
          noItems: 'No clients found',
          start: 'Start by adding your first client'
        };
      case 'Restaurant':
        return {
          title: 'Guests',
          subtitle: 'Manage your guest list',
          customer: 'Guest',
          add: 'Add Guest',
          edit: 'Edit Guest',
          total: 'Total Guests',
          noItems: 'No guests found',
          start: 'Start by adding your first guest'
        };
      default:
        return {
          title: 'Customers',
          subtitle: 'Manage your customer list',
          customer: 'Customer',
          add: 'Add Customer',
          edit: 'Edit Customer',
          total: 'Total Customers',
          noItems: 'No customers found',
          start: 'Start by adding your first customer'
        };
    }
  };

  const terms = getTerminology();

  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerTypeFilter, setCustomerTypeFilter] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    customer_type: 'General',
    vat_number: '',
    business_name: '',
    cr_number: '',
    address_proof: '',
    contact_person: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    credit_limit: '',
    credit_days: ''
  });

  const { data: ledgers = [], isLoading } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const list = await rcas.entities.Ledger.list();
      return list.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  // Filter customers - show all ledgers that have customer_type field
  const customers = ledgers.filter(l => {
    const hasCustomerType = l.customer_type === 'VAT Customer' || l.customer_type === 'General';
    if (customerTypeFilter === 'All') return hasCustomerType;
    return hasCustomerType && l.customer_type === customerTypeFilter;
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const ledgerData = {
        ...data,
        group_id: 'Sundry Debtors',
        is_active: true,
        company_id: selectedCompanyId
      };
      return rcas.entities.Ledger.create(ledgerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success('Customer created successfully');
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create customer');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Ledger.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success('Customer updated successfully');
      closeDialog();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update customer');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Ledger.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete customer');
    }
  });

  const openDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        customer_type: customer.customer_type || 'General',
        vat_number: customer.vat_number || '',
        business_name: customer.business_name || '',
        cr_number: customer.cr_number || '',
        address_proof: customer.address_proof || '',
        contact_person: customer.contact_person || '',
        address: customer.address || '',
        city: customer.city || '',
        phone: customer.phone || '',
        email: customer.email || '',
        credit_limit: customer.credit_limit || '',
        credit_days: customer.credit_days || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        customer_type: 'General',
        vat_number: '',
        business_name: '',
        cr_number: '',
        address_proof: '',
        contact_person: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        credit_limit: '',
        credit_days: ''
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
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
      credit_limit: formData.credit_limit ? parseFloat(formData.credit_limit) : null,
      credit_days: formData.credit_days ? parseInt(formData.credit_days) : null
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: dataToSave });
    } else {
      createMutation.mutate(dataToSave);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
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
          {row.customer_type || 'General'}
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
      header: 'Credit Limit',
      accessor: 'credit_limit',
      render: (row) => row.credit_limit ? `${row.credit_limit.toFixed(2)} SAR` : '-'
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDialog(row)}
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (await confirm({
                title: 'Delete Customer',
                description: 'Are you sure you want to delete this customer? This action cannot be undone.',
                variant: 'destructive',
                confirmText: 'Delete'
              })) {
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

  if (isLoading) return <LoadingSpinner text="Loading customers..." />;

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer list"
        icon={Users}
      />

      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800">{customers.length}</div>
                <p className="text-sm text-slate-600 mt-1">Total Customers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{customers.filter(c => c.customer_type === 'VAT Customer').length}</div>
                <p className="text-sm text-slate-600 mt-1">VAT Customers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-600">{customers.filter(c => c.customer_type !== 'VAT Customer').length}</div>
                <p className="text-sm text-slate-600 mt-1">General Customers</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Customer List</CardTitle>
              <Button
                onClick={() => openDialog()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
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
                    variant={customerTypeFilter === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomerTypeFilter(type)}
                    className={customerTypeFilter === type ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Start by adding your first customer"
            icon={Users}
          />
        ) : (
          <Card>
            <CardContent className="pt-6">
              <DataTable columns={columns} data={customers} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1">
            <FormField
              label="Customer Name *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter customer name"
              required
            />
            <FormField
              label="Customer Type"
              name="customer_type"
              type="select"
              value={formData.customer_type}
              onChange={handleChange}
              options={[
                { value: 'VAT Customer', label: 'VAT Customer' },
                { value: 'General', label: 'General (Non-VAT)' }
              ]}
            />
            {formData.customer_type === 'VAT Customer' && (
              <>
                <FormField
                  label="VAT Number"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleChange}
                  placeholder="VAT registration number"
                />
                <FormField
                  label="Business Name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Business/Trading name"
                />
                <FormField
                  label="CR Number (Commercial Registration)"
                  name="cr_number"
                  value={formData.cr_number}
                  onChange={handleChange}
                  placeholder="CR number"
                />
                <FormField
                  label="Address Proof"
                  name="address_proof"
                  value={formData.address_proof}
                  onChange={handleChange}
                  placeholder="Address proof document reference"
                />
              </>
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
              placeholder="Customer address"
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
              label="Credit Limit (SAR)"
              name="credit_limit"
              type="number"
              value={formData.credit_limit}
              onChange={handleChange}
              placeholder="0"
            />
            <FormField
              label="Credit Days"
              name="credit_days"
              type="number"
              value={formData.credit_days}
              onChange={handleChange}
              placeholder="0"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingCustomer ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
