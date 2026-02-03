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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Plus, Pencil, Trash2, Eye, EyeOff, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompanyManagement() {
  const queryClient = useQueryClient();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // User Management State
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [selectedCompanyForUsers, setSelectedCompanyForUsers] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Employee');
  const [userLoading, setUserLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    address: '',
    city: '',
    country: 'Saudi Arabia',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    vat_number: '',
    cr_number: '',
    financial_year_start: '',
    financial_year_end: '',
    currency: 'SAR',
    password: '',
    is_active: true
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => rcas.entities.Company.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => rcas.entities.Company.create(data),
    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setSelectedCompanyId(newCompany.id);
      toast.success('Company created successfully');
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to create company: ${error.message}`);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company updated successfully');
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Failed to update company: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Company.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete company: ${error.message}`);
    }
  });

  const handleManageUsers = async (company) => {
    setSelectedCompanyForUsers(company);
    setUsersDialogOpen(true);
    setUserLoading(true);
    try {
      const users = await rcas.auth.getCompanyUsers(company.id);
      setCompanyUsers(users);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setUserLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUserEmail) return;
    
    setUserLoading(true);
    try {
      await rcas.auth.addUserToCompany(selectedCompanyForUsers.id, newUserEmail, newUserRole);
      toast.success("User added successfully");
      setNewUserEmail('');
      // Refresh list
      const users = await rcas.auth.getCompanyUsers(selectedCompanyForUsers.id);
      setCompanyUsers(users);
    } catch (error) {
      toast.error(error.message || "Failed to add user");
    } finally {
      setUserLoading(false);
    }
  };

  const openDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({ ...company });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        name_arabic: '',
        address: '',
        city: '',
        country: 'Saudi Arabia',
        postal_code: '',
        phone: '',
        email: '',
        website: '',
        vat_number: '',
        cr_number: '',
        financial_year_start: '',
        financial_year_end: '',
        currency: 'SAR',
        password: '',
        is_active: true
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    setShowPassword(false);
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
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      header: 'Company',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.name}</p>
          {row.name_arabic && <p className="text-sm text-slate-500">{row.name_arabic}</p>}
        </div>
      )
    },
    {
      header: 'VAT Number',
      accessor: 'vat_number',
      render: (row) => (
        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{row.vat_number || '-'}</code>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (row) => <a href={`mailto:${row.email}`} className="text-emerald-600 hover:underline">{row.email || '-'}</a>
    },
    {
      header: 'Phone',
      accessor: 'phone'
    },
    {
      header: 'Currency',
      accessor: 'currency',
      render: (row) => <Badge className="bg-blue-100 text-blue-700">{row.currency}</Badge>
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
          {row.is_active !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCompanyId(row.id);
              toast.success(`Switched to ${row.name}`);
            }}
            title="Switch to this company"
            className={selectedCompanyId === row.id ? "bg-emerald-100 text-emerald-700" : ""}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleManageUsers(row);
            }}
            title="Manage Users"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Users className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openDialog(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete ${row.name}? This action cannot be undone.`)) {
                deleteMutation.mutate(row.id);
              }
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) return <LoadingSpinner text="Loading companies..." />;

  return (
    <div>
      <PageHeader
        title="Company Management"
        subtitle="Manage all your companies and their details"
        primaryAction={{
          label: 'Add Company',
          onClick: () => openDialog()
        }}
      />

      {companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Companies"
          description="Create your first company to get started"
          action={{
            label: 'Create Company',
            onClick: () => openDialog()
          }}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <DataTable columns={columns} data={companies} />
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Company Name (English) *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter company name"
                required
              />
              <FormField
                label="Company Name (Arabic)"
                name="name_arabic"
                value={formData.name_arabic}
                onChange={handleChange}
                placeholder="أدخل اسم الشركة"
              />
            </div>

            <FormField
              label="Address"
              name="address"
              type="textarea"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter company address"
              rows={2}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
              <FormField
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
              />
              <FormField
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="Postal code"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="company@example.com"
              />
              <FormField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </div>

            <FormField
              label="Website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="VAT Number"
                name="vat_number"
                value={formData.vat_number}
                onChange={handleChange}
                placeholder="VAT registration number"
              />
              <FormField
                label="CR Number"
                name="cr_number"
                value={formData.cr_number}
                onChange={handleChange}
                placeholder="Commercial registration number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Financial Year Start"
                name="financial_year_start"
                type="date"
                value={formData.financial_year_start}
                onChange={handleChange}
              />
              <FormField
                label="Financial Year End"
                name="financial_year_end"
                type="date"
                value={formData.financial_year_end}
                onChange={handleChange}
              />
              <FormField
                label="Currency"
                name="currency"
                type="select"
                value={formData.currency}
                onChange={handleChange}
                options={[
                  { value: 'SAR', label: 'SAR - Saudi Riyal' },
                  { value: 'USD', label: 'USD - US Dollar' },
                  { value: 'EUR', label: 'EUR - Euro' },
                  { value: 'AED', label: 'AED - UAE Dirham' }
                ]}
              />
            </div>

            <FormField
              label="Company Password (Optional)"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Set a password to protect this company"
              autoComplete="new-password"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Company is active
              </label>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCompany ? 'Update Company' : 'Create Company')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={usersDialogOpen} onOpenChange={setUsersDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Users - {selectedCompanyForUsers?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg border">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Add User by Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="user@example.com"
                    className="flex-1 h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                  <select 
                    className="h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
              <Button onClick={handleAddUser} disabled={userLoading || !newUserEmail}>
                {userLoading ? <LoadingSpinner size="sm" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Add User
              </Button>
            </div>

            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Role</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {companyUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500">
                        No users assigned to this company yet.
                      </td>
                    </tr>
                  ) : (
                    companyUsers.map(user => (
                      <tr key={user.id}>
                        <td className="py-3 px-4 font-medium">{user.full_name || user.username}</td>
                        <td className="py-3 px-4 text-slate-500">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-slate-100">{user.role}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUsersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
