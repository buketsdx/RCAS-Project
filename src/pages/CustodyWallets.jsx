import React, { useState } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { generateUniqueID, ID_PREFIXES } from '@/components/common/IDGenerator';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Wallet, Plus, Pencil, Trash2, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import { getAllTypes, addStoredType, getTransactionNature } from '@/lib/custodyTypes';

export default function CustodyWallets() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: '', nature: 'Withdrawal' });
  const [availableTypes, setAvailableTypes] = useState(getAllTypes());
  const [formData, setFormData] = useState({
    name: '', holder_name: '', holder_type: 'Employee', currency: 'SAR', purpose: '', contact_phone: '', notes: ''
  });
  const [transactionData, setTransactionData] = useState({
    type: 'Deposit', amount: '', description: '', reference: '', transfer_to_wallet_id: ''
  });

  const { data: wallets = [], isLoading } = useQuery({ queryKey: ['custodyWallets'], queryFn: () => rcas.entities.CustodyWallet.list() });
  const { data: transactions = [] } = useQuery({ queryKey: ['custodyTransactions'], queryFn: () => rcas.entities.CustodyTransaction.list('-date') });

  const createWalletMutation = useMutation({
    mutationFn: async (data) => {
      const walletId = await generateUniqueID('wallet', ID_PREFIXES.WALLET);
      return rcas.entities.CustodyWallet.create({ ...data, wallet_id: walletId, balance: 0 });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custodyWallets'] }); toast.success('Wallet created'); closeDialog(); }
  });

  const updateWalletMutation = useMutation({
    mutationFn: ({ id, data }) => rcas.entities.CustodyWallet.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custodyWallets'] }); toast.success('Wallet updated'); closeDialog(); }
  });

  const deleteWalletMutation = useMutation({
    mutationFn: (id) => rcas.entities.CustodyWallet.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['custodyWallets'] }); toast.success('Wallet deleted'); }
  });

  const transactionMutation = useMutation({
    mutationFn: async (data) => {
      const wallet = wallets.find(w => w.id === selectedWallet.id);
      let newBalance = parseFloat(wallet.balance) || 0;
      const amount = parseFloat(data.amount) || 0;
      const nature = getTransactionNature(data.type);

      if (nature === 'Deposit') newBalance += amount;
      else if (nature === 'Withdrawal') newBalance -= amount;
      else if (nature === 'Transfer') {
        newBalance -= amount;
        const targetWallet = wallets.find(w => w.id === data.transfer_to_wallet_id);
        if (targetWallet) {
          await rcas.entities.CustodyWallet.update(targetWallet.id, { balance: (parseFloat(targetWallet.balance) || 0) + amount });
        }
      }

      await rcas.entities.CustodyWallet.update(wallet.id, { balance: newBalance });
      const transactionId = await generateUniqueID('custody_trans', 'TXN');
      return rcas.entities.CustodyTransaction.create({
        ...data, transaction_id: transactionId, wallet_id: wallet.id, date: format(new Date(), 'yyyy-MM-dd'), amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodyWallets'] });
      queryClient.invalidateQueries({ queryKey: ['custodyTransactions'] });
      toast.success('Transaction recorded');
      setTransactionDialogOpen(false);
      setTransactionData({ type: 'Deposit', amount: '', description: '', reference: '', transfer_to_wallet_id: '' });
    }
  });

  const openDialog = (wallet = null) => {
    if (wallet) { setEditingWallet(wallet); setFormData({ ...wallet }); }
    else { setEditingWallet(null); setFormData({ name: '', holder_name: '', holder_type: 'Employee', currency: 'SAR', purpose: '', contact_phone: '', notes: '' }); }
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditingWallet(null); };

  const openTransactionDialog = (wallet) => {
    setSelectedWallet(wallet);
    setTransactionDialogOpen(true);
  };

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleTransactionChange = (e) => setTransactionData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingWallet) updateWalletMutation.mutate({ id: editingWallet.id, data: formData });
    else createWalletMutation.mutate(formData);
  };

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    transactionMutation.mutate(transactionData);
  };

  const handleAddType = (e) => {
    e.preventDefault();
    if (!newTypeData.name) return;
    
    const newType = { value: newTypeData.name, label: newTypeData.name, nature: newTypeData.nature };
    addStoredType(newType);
    setAvailableTypes(getAllTypes());
    setTransactionData(prev => ({ ...prev, type: newType.value }));
    setShowTypeDialog(false);
    setNewTypeData({ name: '', nature: 'Withdrawal' });
    toast.success('New transaction type added');
  };

  const handleNewTransaction = () => {
    navigate('/CustodyWalletEntry');
  };

  const selectedTypeNature = getTransactionNature(transactionData.type);
  const totalBalance = wallets.reduce((sum, w) => sum + (parseFloat(w.balance) || 0), 0);

  const columns = [
    { header: 'Wallet ID', accessor: 'wallet_id', render: (row) => <span className="font-mono text-purple-600">{row.wallet_id}</span> },
    { header: 'Name', accessor: 'name', render: (row) => <span className="font-medium">{row.name}</span> },
    { header: 'Holder', accessor: 'holder_name', render: (row) => <div><p>{row.holder_name}</p><p className="text-xs text-slate-500">{row.holder_type}</p></div> },
    { header: 'Balance', accessor: 'balance', render: (row) => <span className={`font-bold ${parseFloat(row.balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{parseFloat(row.balance || 0).toFixed(2)} {row.currency}</span> },
    { header: 'Purpose', accessor: 'purpose' },
    { header: 'Actions', render: (row) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" onClick={() => openTransactionDialog(row)} title="Add Transaction"><RefreshCw className="h-4 w-4 text-blue-500" /></Button>
        <Button variant="ghost" size="icon" onClick={() => openDialog(row)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { if(confirm('Delete?')) deleteWalletMutation.mutate(row.id); }}><Trash2 className="h-4 w-4 text-red-500" /></Button>
      </div>
    )}
  ];

  if (isLoading) return <LoadingSpinner text="Loading wallets..." />;

  return (
    <div>
      <PageHeader title="Custody Wallets" subtitle="Separate wallets for flexible use" primaryAction={{ label: 'Add Wallet', onClick: () => openDialog() }} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-700">Total Wallets</p>
                <p className="text-2xl font-bold text-purple-700">{wallets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="pt-6">
            <p className="text-sm text-emerald-700">Total Balance</p>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalBalance, 'SAR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Recent Transactions</p>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
      </div>

      {wallets.length === 0 ? (
        <EmptyState icon={Wallet} title="No Custody Wallets" description="Create wallets for flexible fund management" action={{ label: 'Create Wallet', onClick: () => openDialog() }} />
      ) : (
        <DataTable columns={columns} data={wallets} />
      )}

      {/* Wallet Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingWallet ? 'Edit' : 'Create'} Wallet</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <FormField label="Wallet Name" name="name" value={formData.name} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Holder Name" name="holder_name" value={formData.holder_name} onChange={handleChange} required />
                <FormField label="Holder Type" name="holder_type" type="select" value={formData.holder_type} onChange={handleChange} options={[{ value: 'Employee', label: 'Employee' }, { value: 'Agent', label: 'Agent' }, { value: 'Partner', label: 'Partner' }, { value: 'Other', label: 'Other' }]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Currency" name="currency" type="select" value={formData.currency} onChange={handleChange} options={[{ value: 'SAR', label: 'SAR' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
                <FormField label="Phone" name="contact_phone" value={formData.contact_phone} onChange={handleChange} />
              </div>
              <FormField label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
              <FormField label="Notes" name="notes" type="textarea" value={formData.notes} onChange={handleChange} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">{editingWallet ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Dialog */}
      <Dialog open={transactionDialogOpen} onOpenChange={setTransactionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Transaction - {selectedWallet?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleTransactionSubmit}>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-slate-50 rounded-lg mb-4">
                <p className="text-sm text-slate-500">Current Balance</p>
                <p className="text-xl font-bold">{parseFloat(selectedWallet?.balance || 0).toFixed(2)} {selectedWallet?.currency}</p>
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormField label="Transaction Type" name="type" type="select" value={transactionData.type} onChange={handleTransactionChange} options={availableTypes} />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="mb-1"
                  onClick={() => setShowTypeDialog(true)}
                  title="Add New Type"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <FormField label="Amount" name="amount" type="number" value={transactionData.amount} onChange={handleTransactionChange} required />
              {selectedTypeNature === 'Transfer' && (
                <FormField label="Transfer To" name="transfer_to_wallet_id" type="select" value={transactionData.transfer_to_wallet_id} onChange={handleTransactionChange} options={wallets.filter(w => w.id !== selectedWallet?.id).map(w => ({ value: w.id, label: `${w.name} (${w.holder_name})` }))} />
              )}
              <FormField label="Reference" name="reference" value={transactionData.reference} onChange={handleTransactionChange} />
              <FormField label="Description" name="description" type="textarea" value={transactionData.description} onChange={handleTransactionChange} rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTransactionDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={transactionMutation.isPending}>
                {selectedTypeNature === 'Deposit' && <ArrowDownLeft className="h-4 w-4 mr-2" />}
                {selectedTypeNature === 'Withdrawal' && <ArrowUpRight className="h-4 w-4 mr-2" />}
                {selectedTypeNature === 'Transfer' && <RefreshCw className="h-4 w-4 mr-2" />}
                Record Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Type Dialog */}
      <Dialog open={showTypeDialog} onOpenChange={setShowTypeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Transaction Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddType} className="space-y-4">
            <FormField 
              label="Type Name" 
              value={newTypeData.name} 
              onChange={(e) => setNewTypeData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Bank Charges, Fuel Expense"
              required
            />
            <FormField 
              label="Nature" 
              type="select"
              value={newTypeData.nature} 
              onChange={(e) => setNewTypeData(prev => ({ ...prev, nature: e.target.value }))}
              options={[
                { value: 'Deposit', label: 'Deposit (Add Funds)' },
                { value: 'Withdrawal', label: 'Withdrawal (Deduct Funds)' }
              ]}
            />
            <DialogFooter>
              <Button type="submit">Add Type</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}