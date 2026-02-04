import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rcas } from '@/api/rcasClient';
import { useCompany } from '@/context/CompanyContext';
import { generateUniqueID } from '@/components/common/IDGenerator';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save, Plus } from 'lucide-react';
import { getAllTypes, addStoredType, getTransactionNature } from '@/lib/custodyTypes';

export default function CustodyWalletEntry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [newTypeData, setNewTypeData] = useState({ name: '', nature: 'Withdrawal' });
  const [availableTypes, setAvailableTypes] = useState(getAllTypes());
  
  const [formData, setFormData] = useState({
    wallet_id: '',
    type: 'Deposit',
    amount: '',
    description: '',
    reference: '',
    transfer_to_wallet_id: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // Fetch wallets list
  const { data: wallets = [] } = useQuery({ 
    queryKey: ['custodyWallets', selectedCompanyId], 
    queryFn: async () => {
      const list = await rcas.entities.CustodyWallet.list();
      return list.filter(w => String(w.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const transactionMutation = useMutation({
    mutationFn: async (data) => {
      const wallet = wallets.find(w => w.id === Number(data.wallet_id));
      if (!wallet) throw new Error("Source wallet not found");

      let newBalance = parseFloat(wallet.balance) || 0;
      const amount = parseFloat(data.amount) || 0;
      const nature = getTransactionNature(data.type);

      // Calculate new balance based on type
      if (nature === 'Deposit') {
        newBalance += amount;
      } else if (nature === 'Withdrawal') {
        if (newBalance < amount) throw new Error("Insufficient balance");
        newBalance -= amount;
      } else if (nature === 'Transfer') {
        if (newBalance < amount) throw new Error("Insufficient balance");
        newBalance -= amount;
        
        // Handle target wallet for transfer
        const targetWallet = wallets.find(w => w.id === data.transfer_to_wallet_id);
        if (targetWallet) {
          const targetBalance = (parseFloat(targetWallet.balance) || 0) + amount;
          await rcas.entities.CustodyWallet.update(targetWallet.id, { balance: targetBalance });
        }
      }

      // Update source wallet balance
      await rcas.entities.CustodyWallet.update(wallet.id, { balance: newBalance });
      
      // Create transaction record
      const transactionId = await generateUniqueID('custody_trans', 'TXN');
      
      return rcas.entities.CustodyTransaction.create({
        ...data,
        transaction_id: transactionId,
        wallet_id: wallet.id,
        amount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodyWallets'] });
      queryClient.invalidateQueries({ queryKey: ['custodyTransactions'] });
      toast.success('Transaction recorded successfully');
      navigate('/CustodyWallets');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record transaction');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.wallet_id) {
      toast.error("Please select a wallet");
      return;
    }
    if (selectedTypeNature === 'Transfer' && !formData.transfer_to_wallet_id) {
      toast.error("Please select a target wallet for transfer");
      return;
    }
    transactionMutation.mutate(formData);
  };

  const selectedWallet = wallets.find(w => w.id === formData.wallet_id);
  const selectedTypeNature = getTransactionNature(formData.type);

  const handleAddType = (e) => {
    e.preventDefault();
    if (!newTypeData.name) return;
    
    const newType = { value: newTypeData.name, label: newTypeData.name, nature: newTypeData.nature };
    addStoredType(newType);
    setAvailableTypes(getAllTypes());
    setFormData(prev => ({ ...prev, type: newType.value }));
    setShowTypeDialog(false);
    setNewTypeData({ name: '', nature: 'Withdrawal' });
    toast.success('New transaction type added');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader 
        title="New Custody Transaction" 
        subtitle="Record deposit, withdrawal or transfer"
        backUrl="/CustodyWallets"
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Select Wallet" 
                name="wallet_id" 
                type="select" 
                value={formData.wallet_id} 
                onChange={handleChange} 
                options={wallets.map(w => ({ 
                  value: w.id, 
                  label: `${w.name} (${parseFloat(w.balance).toFixed(2)} ${w.currency})` 
                }))}
                required
                placeholder="Select source wallet"
              />

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormField 
                    label="Transaction Type" 
                    name="type" 
                    type="select" 
                    value={formData.type} 
                    onChange={handleChange} 
                    options={availableTypes} 
                  />
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
            </div>

            {selectedWallet && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-500">Current Balance</p>
                  <p className="text-lg font-bold text-slate-700">
                    {parseFloat(selectedWallet.balance).toFixed(2)} {selectedWallet.currency}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Holder</p>
                  <p className="font-medium">{selectedWallet.holder_name}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Amount" 
                name="amount" 
                type="number" 
                value={formData.amount} 
                onChange={handleChange} 
                required 
                min="0.01"
                step="0.01"
              />
              
              <FormField 
                label="Date" 
                name="date" 
                type="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
              />
            </div>

            {selectedTypeNature === 'Transfer' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800 mb-3">Transfer Destination</h4>
                <FormField 
                  label="Transfer To Wallet" 
                  name="transfer_to_wallet_id" 
                  type="select" 
                  value={formData.transfer_to_wallet_id} 
                  onChange={handleChange} 
                  options={wallets
                    .filter(w => w.id !== formData.wallet_id)
                    .map(w => ({ 
                      value: w.id, 
                      label: `${w.name} - ${w.holder_name}` 
                    }))}
                  required={selectedTypeNature === 'Transfer'}
                  placeholder="Select destination wallet"
                />
              </div>
            )}

            <div className="space-y-4">
              <FormField 
                label="Reference / Receipt No." 
                name="reference" 
                value={formData.reference} 
                onChange={handleChange} 
                placeholder="e.g. RCP-001 or Bank Ref"
              />
              
              <FormField 
                label="Description / Notes" 
                name="description" 
                type="textarea" 
                value={formData.description} 
                onChange={handleChange} 
                rows={3}
                placeholder="Enter details about this transaction..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/CustodyWallets')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px]"
                disabled={transactionMutation.isPending}
              >
                {transactionMutation.isPending ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Transaction
                  </>
                )}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>

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