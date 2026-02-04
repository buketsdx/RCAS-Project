import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '../context/CompanyContext';
import { formatCurrency, generateVoucherCode } from '@/utils';
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
import { format } from 'date-fns';
import { Users, Plus, Pencil, Trash2 } from 'lucide-react';

export default function Employees() {
  const { type, selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();

  const getTerminology = () => {
    switch (type) {
      case 'Salon':
        return {
          title: 'Staff Management',
          subtitle: 'Manage your stylists and support staff',
          entity: 'Staff Member',
          add: 'Add Staff',
          edit: 'Edit Staff',
          noItems: 'No staff members found',
          start: 'Start by adding your first staff member'
        };
      case 'Restaurant':
        return {
          title: 'Staff Management',
          subtitle: 'Manage your kitchen and service staff',
          entity: 'Staff Member',
          add: 'Add Staff',
          edit: 'Edit Staff',
          noItems: 'No staff members found',
          start: 'Start by adding your first staff member'
        };
      default:
        return {
          title: 'Employees',
          subtitle: 'Manage your employee list',
          entity: 'Employee',
          add: 'Add Employee',
          edit: 'Edit Employee',
          noItems: 'No employees found',
          start: 'Start by adding your first employee'
        };
    }
  };

  const terms = getTerminology();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    employee_code: '', name: '', name_arabic: '', designation: '', department: '',
    date_of_joining: '', date_of_birth: '', gender: '', nationality: '',
    iqama_number: '', passport_number: '', phone: '', email: '', address: '',
    basic_salary: '', housing_allowance: '', transport_allowance: '', other_allowances: '',
    gosi_number: '', bank_name: '', bank_account: '', iban: '',
    is_dual_commission_eligible: false
  });

  const { data: employees = [], isLoading } = useQuery({ 
    queryKey: ['employees', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.Employee.list();
      return list.filter(e => String(e.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const employeeCode = await generateVoucherCode('Employee');
      return rcas.entities.Employee.create({ ...data, employee_code: employeeCode, company_id: selectedCompanyId });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees', selectedCompanyId] }); toast.success(`${terms.entity} added`); closeDialog(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.Employee.update(id, { ...data, company_id: selectedCompanyId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees', selectedCompanyId] }); toast.success(`${terms.entity} updated`); closeDialog(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => rcas.entities.Employee.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees', selectedCompanyId] }); toast.success(`${terms.entity} deleted`); }
  });

  const openDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({ ...employee });
    } else {
      setEditingEmployee(null);
      // Auto-generate employee code for new employees
      generateVoucherCode('Employee').then(code => {
        setFormData({
          employee_code: code, name: '', name_arabic: '', designation: '', department: '',
          date_of_joining: '', date_of_birth: '', gender: '', nationality: '',
          iqama_number: '', passport_number: '', phone: '', email: '', address: '',
          basic_salary: '', housing_allowance: '', transport_allowance: '', other_allowances: '',
          gosi_number: '', bank_name: '', bank_account: '', iban: '',
          is_dual_commission_eligible: false
        });
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingEmployee(null); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      basic_salary: parseFloat(formData.basic_salary) || 0,
      housing_allowance: parseFloat(formData.housing_allowance) || 0,
      transport_allowance: parseFloat(formData.transport_allowance) || 0,
      other_allowances: parseFloat(formData.other_allowances) || 0,
      is_dual_commission_eligible: formData.is_dual_commission_eligible === true || formData.is_dual_commission_eligible === 'true'
    };
    if (editingEmployee) updateMutation.mutate({ id: editingEmployee.id, data });
    else createMutation.mutate(data);
  };

  const columns = [
    { header: 'Code', accessor: 'employee_code', render: (row) => <span className="font-mono">{row.employee_code}</span> },
    { header: 'Name', accessor: 'name', render: (row) => (
      <div><p className="font-medium">{row.name}</p>{row.name_arabic && <p className="text-xs text-slate-500">{row.name_arabic}</p>}</div>
    )},
    { header: 'Designation', accessor: 'designation' },
    { header: 'Type', accessor: 'is_dual_commission_eligible', render: (row) => {
      const isEligible = row.is_dual_commission_eligible === true || row.is_dual_commission_eligible === 'true';
      return <Badge variant={isEligible ? "default" : "secondary"}>{isEligible ? 'Pro' : 'Normal'}</Badge>;
    }},
    { header: 'Department', accessor: 'department' },
    { header: 'Joining Date', accessor: 'date_of_joining', render: (row) => row.date_of_joining ? format(new Date(row.date_of_joining), 'dd MMM yyyy') : '-' },
    { header: 'Status', accessor: 'is_active', render: (row) => <Badge className={row.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}>{row.is_active !== false ? 'Active' : 'Inactive'}</Badge> },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openDialog(row); }}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if(confirm('Delete?')) deleteMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )}
  ];

  if (isLoading) return <LoadingSpinner text="Loading employees..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={terms.title}
        subtitle={terms.subtitle}
        primaryAction={{ label: terms.add, onClick: () => openDialog() }}
      />

      {employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={terms.noItems}
          description={terms.start}
          action={{ label: terms.add, onClick: () => openDialog() }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          searchPlaceholder={`Search ${terms.entity.toLowerCase()}s...`}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? terms.edit : terms.add}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="salary">Salary</TabsTrigger>
                <TabsTrigger value="banking">Banking</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Employee Code" name="employee_code" value={formData.employee_code} onChange={handleChange} required />
                  <FormField label="Name (English)" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <FormField label="Name (Arabic)" name="name_arabic" value={formData.name_arabic} onChange={handleChange} />
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
                  <FormField label="Gender" name="gender" type="select" value={formData.gender} onChange={handleChange} options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }]} />
                  <FormField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Iqama Number" name="iqama_number" value={formData.iqama_number} onChange={handleChange} />
                  <FormField label="Passport Number" name="passport_number" value={formData.passport_number} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
                  <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                </div>
                <FormField label="Address" name="address" type="textarea" value={formData.address} onChange={handleChange} rows={2} />
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Designation" name="designation" value={formData.designation} onChange={handleChange} />
                  <FormField label="Department" name="department" value={formData.department} onChange={handleChange} />
                </div>
                <FormField label="Date of Joining" name="date_of_joining" type="date" value={formData.date_of_joining} onChange={handleChange} />
                <FormField label="GOSI Number" name="gosi_number" value={formData.gosi_number} onChange={handleChange} />
              </TabsContent>

              <TabsContent value="salary" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Basic Salary (SAR)" name="basic_salary" type="number" value={formData.basic_salary} onChange={handleChange} />
                  <FormField label="Housing Allowance (SAR)" name="housing_allowance" type="number" value={formData.housing_allowance} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Transport Allowance (SAR)" name="transport_allowance" type="number" value={formData.transport_allowance} onChange={handleChange} />
                  <FormField label="Other Allowances (SAR)" name="other_allowances" type="number" value={formData.other_allowances} onChange={handleChange} />
                </div>
                
                <FormField 
                  label="Staff Type" 
                  name="is_dual_commission_eligible" 
                  type="select" 
                  value={formData.is_dual_commission_eligible ? 'true' : 'false'} 
                  onChange={(e) => setFormData(prev => ({ ...prev, is_dual_commission_eligible: e.target.value === 'true' }))}
                  options={[
                    { value: 'false', label: 'Normal (Standard Commission)' },
                    { value: 'true', label: 'Pro (Dual Commission Eligible)' }
                  ]} 
                />

                <div className="p-4 bg-emerald-50 rounded-lg mt-4">
                  <p className="text-sm text-slate-600">Total Salary:</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(((parseFloat(formData.basic_salary) || 0) + (parseFloat(formData.housing_allowance) || 0) + (parseFloat(formData.transport_allowance) || 0) + (parseFloat(formData.other_allowances) || 0)), 'SAR')}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="banking" className="space-y-4 mt-4">
                <FormField label="Bank Name" name="bank_name" value={formData.bank_name} onChange={handleChange} />
                <FormField label="Bank Account Number" name="bank_account" value={formData.bank_account} onChange={handleChange} />
                <FormField label="IBAN" name="iban" value={formData.iban} onChange={handleChange} />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{editingEmployee ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}