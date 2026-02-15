import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { ROLES } from '@/context/AuthContext';
import { useConfirm } from '@/context/ConfirmContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ShieldCheck, UserCog, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import FormField from '@/components/forms/FormField';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UserManagement() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: ROLES.EMPLOYEE
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await rcas.entities.User.list();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        if (!await confirm({
          title: 'Update User',
          description: 'Are you sure you want to update this user details?',
          confirmText: 'Update'
        })) return;
        
        await rcas.entities.User.update(editingId, formData);
        toast.success("User updated successfully");
      } else {
        // Check for duplicate username
        const exists = users.some(u => u.username.toLowerCase() === formData.username.toLowerCase());
        if (exists) {
          toast.error("Username already exists");
          return;
        }
        await rcas.entities.User.create(formData);
        toast.success("User created successfully");
      }
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Failed to save user", error);
      toast.error("Operation failed");
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      full_name: user.full_name,
      email: user.email || '',
      role: user.role
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!await confirm({
      title: 'Delete User',
      description: 'Are you sure you want to delete this user? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete'
    })) return;

    try {
      await rcas.entities.User.delete(id);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to delete user");
    }
  };

  const columns = [
    { header: "Full Name", accessor: "full_name" },
    { header: "Username", accessor: "username" },
    { header: "Role", accessor: "role", 
      render: (user) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.role === ROLES.SUPER_ADMIN ? 'bg-purple-100 text-purple-700' :
          user.role === ROLES.ADMIN ? 'bg-blue-100 text-blue-700' :
          user.role === ROLES.OWNER ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-700'
        }`}>
          {user.role}
        </span>
      )
    },
    { header: "Email", accessor: "email" },
    { 
      header: "Actions", 
      accessor: "id", 
      className: "text-right",
      render: (user) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>
          {user.role !== ROLES.SUPER_ADMIN && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        subtitle="Manage system users and their roles"
        primaryAction={{
          label: "Add User",
          onClick: () => {
            setEditingId(null);
            setFormData({ username: '', password: '', full_name: '', email: '', role: ROLES.EMPLOYEE });
            setDialogOpen(true);
          }
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === ROLES.ADMIN || u.role === ROLES.SUPER_ADMIN).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(users.map(u => u.role)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable 
        data={users} 
        columns={columns} 
        loading={loading}
        searchable
        searchKey="full_name"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
            <FormField label="Username" name="username" value={formData.username} onChange={handleChange} required />
            <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
            <FormField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} required />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-emerald-600"
              >
                {Object.values(ROLES).map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
