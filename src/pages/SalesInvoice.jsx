import React, { useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl, formatCurrency, generateVoucherCode } from "@/utils";
import { useCompany } from '@/context/CompanyContext';
import { useLocation } from 'react-router-dom';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import VoucherItemsTable from '@/components/vouchers/VoucherItemsTable';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { format } from 'date-fns';
import { Save, Printer, ArrowLeft, Plus, X } from 'lucide-react';

export default function SalesInvoice() {
  const queryClient = useQueryClient();
  const { selectedCompanyId } = useCompany();
  const location = useLocation();
  const routeVoucher = location.state?.voucher;
  const routeItems = location.state?.items || [];
  const urlParams = new URLSearchParams(window.location.search);
  const voucherId = urlParams.get('id');

  const [formData, setFormData] = useState(() => {
    const base = {
      voucher_type: 'Sales',
      voucher_number: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      party_ledger_id: '',
      party_name: '',
      reference_number: '',
      billing_address: '',
      narration: '',
      status: 'Confirmed',
      customer_vat_number: '',
      customer_business_name: '',
      customer_cr_number: '',
      customer_address_proof: '',
      customer_type: 'General'
    };

    if (!routeVoucher) return base;

    return {
      ...base,
      voucher_number: routeVoucher.voucher_number || base.voucher_number,
      date: routeVoucher.date || base.date,
      party_ledger_id: routeVoucher.party_ledger_id || '',
      party_name: routeVoucher.party_name || '',
      reference_number: routeVoucher.reference_number || '',
      billing_address: routeVoucher.billing_address || '',
      narration: routeVoucher.narration || '',
      status: routeVoucher.status || 'Confirmed'
    };
  });

  const [customerType, setCustomerType] = useState('General');
  const [showNewCustomerDialog, setShowNewCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
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
    email: ''
  });

  const [items, setItems] = useState(() => {
    if (routeItems && routeItems.length > 0) {
      return routeItems.map(item => ({
        id: item.id,
        stock_item_id: item.stock_item_id,
        stock_item_name: item.stock_item_name,
        quantity: item.quantity,
        rate: item.rate,
        discount_percent: item.discount_percent || 0,
        discount_amount: item.discount_amount || 0,
        vat_rate: item.vat_rate || 15,
        vat_amount: item.vat_amount || 0,
        amount: item.amount,
        total_amount: item.total_amount
      }));
    }
    return [{ stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }];
  });

  const { data: ledgers = [] } = useQuery({
    queryKey: ['ledgers', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Ledger.list();
      return all.filter(l => String(l.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stockItems', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.StockItem.list();
      return all.filter(i => String(i.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees', selectedCompanyId],
    queryFn: async () => {
      const all = await rcas.entities.Employee.list();
      return all.filter(e => String(e.company_id) === String(selectedCompanyId));
    },
    enabled: !!selectedCompanyId
  });

  const { data: voucher, isLoading: isLoadingVoucher } = useQuery({
    queryKey: ['voucher', voucherId, selectedCompanyId],
    queryFn: async () => {
      if (!voucherId || !selectedCompanyId) return null;
      const list = await rcas.entities.Voucher.list();
      return list.find(
        (v) =>
          v.id === voucherId &&
          String(v.company_id) === String(selectedCompanyId)
      );
    },
    enabled: !!voucherId && !!selectedCompanyId,
    onSuccess: (voucher) => {
      if (!voucher) return;

      const inferredCustomerType =
        voucher.customer_type ||
        (voucher.customer_vat_number ||
        voucher.customer_business_name ||
        voucher.customer_cr_number ||
        voucher.customer_address_proof
          ? 'VAT Customer'
          : 'General');

      setFormData({
        voucher_type: 'Sales',
        voucher_number: voucher.voucher_number || '',
        date: voucher.date || format(new Date(), 'yyyy-MM-dd'),
        party_ledger_id: voucher.party_ledger_id || '',
        party_name: voucher.party_name || '',
        reference_number: voucher.reference_number || '',
        billing_address: voucher.billing_address || '',
        narration: voucher.narration || '',
        status: voucher.status || 'Confirmed',
        customer_vat_number: voucher.customer_vat_number || '',
        customer_business_name: voucher.customer_business_name || '',
        customer_cr_number: voucher.customer_cr_number || '',
        customer_address_proof: voucher.customer_address_proof || '',
        customer_type: inferredCustomerType
      });
      setCustomerType(inferredCustomerType);
      setNewCustomer(prev => ({ ...prev, customer_type: inferredCustomerType }));
    }
  });

  const { data: existingItems = [] } = useQuery({
    queryKey: ['voucherItems', voucherId],
    queryFn: async () => {
      if (!voucherId) return [];
      const allItems = await rcas.entities.VoucherItem.list();
      return allItems.filter(item => item.voucher_id === voucherId);
    },
    enabled: !!voucherId && !!voucher && routeItems.length === 0,
    onSuccess: (itemsFromServer) => {
      if (voucherId && itemsFromServer && itemsFromServer.length > 0) {
        setItems(itemsFromServer.map(item => ({
          id: item.id,
          stock_item_id: item.stock_item_id,
          stock_item_name: item.stock_item_name,
          quantity: item.quantity,
          rate: item.rate,
          discount_percent: item.discount_percent || 0,
          discount_amount: item.discount_amount || 0,
          vat_rate: item.vat_rate || 15,
          vat_amount: item.vat_amount || 0,
          amount: item.amount,
          total_amount: item.total_amount
        })));
      }
    }
  });


  useEffect(() => {
    if (!voucherId && !formData.voucher_number) {
      generateVoucherCode('Sales').then(code => {
        setFormData(prev => ({
          ...prev,
          voucher_number: code
        }));
      });
    }
  }, [voucherId, formData.voucher_number]);

  const partyLedgers = ledgers.filter(l => {
    if (voucherId && formData.party_ledger_id && String(l.id) === String(formData.party_ledger_id)) {
      return true;
    }
    return l.customer_type === customerType;
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (customerData) => {
      const ledgerData = {
        name: customerData.name,
        group_id: 'Sundry Debtors',
        customer_type: customerData.customer_type,
        vat_number: customerData.vat_number || '',
        business_name: customerData.business_name || '',
        cr_number: customerData.cr_number || '',
        address_proof: customerData.address_proof || '',
        contact_person: customerData.contact_person || '',
        address: customerData.address || '',
        city: customerData.city || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        is_active: true,
        company_id: selectedCompanyId
      };
      return rcas.entities.Ledger.create(ledgerData);
    },
    onSuccess: (newLedger) => {
      queryClient.invalidateQueries({ queryKey: ['ledgers', selectedCompanyId] });
      toast.success('Customer created successfully');
      setFormData(prev => ({
        ...prev,
        party_ledger_id: newLedger.id,
        party_name: newLedger.name,
        billing_address: newLedger.address || '',
        customer_type: newLedger.customer_type || 'General',
        customer_vat_number: newLedger.vat_number || '',
        customer_business_name: newLedger.business_name || '',
        customer_cr_number: newLedger.cr_number || '',
        customer_address_proof: newLedger.address_proof || ''
      }));
      setShowNewCustomerDialog(false);
      setNewCustomer({
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
        email: ''
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create customer');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      try {
        const grossAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const vatAmount = items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0);
        const netAmount = items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0);

        const voucherData = {
          ...formData,
          gross_amount: grossAmount,
          vat_amount: vatAmount,
          net_amount: netAmount,
          company_id: selectedCompanyId
        };

        let voucher;
        if (voucherId) {
          voucher = await rcas.entities.Voucher.update(voucherId, voucherData);
          // Delete old items
          for (const item of existingItems) {
            try {
              await rcas.entities.VoucherItem.delete(item.id);
            } catch (error) {
              console.warn('Failed to delete item:', error);
            }
          }
        } else {
          voucher = await rcas.entities.Voucher.create(voucherData);
        }

        // Create new items
        for (const item of items) {
          if (item.stock_item_id) {
            try {
              await rcas.entities.VoucherItem.create({
                voucher_id: voucher.id,
                stock_item_id: item.stock_item_id,
                stock_item_name: item.stock_item_name,
                quantity: parseFloat(item.quantity) || 0,
                rate: parseFloat(item.rate) || 0,
                discount_percent: parseFloat(item.discount_percent) || 0,
                discount_amount: parseFloat(item.discount_amount) || 0,
                vat_rate: parseFloat(item.vat_rate) || 15,
                vat_amount: parseFloat(item.vat_amount) || 0,
                amount: parseFloat(item.amount) || 0,
                total_amount: parseFloat(item.total_amount) || 0,
                salesman_id: item.salesman_id || null
              });
            } catch (error) {
              console.warn('Failed to create item:', error);
            }
          }
        }

        return voucher;
      } catch (error) {
        throw new Error(error.message || 'Failed to save invoice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salesVouchers', selectedCompanyId] });
      queryClient.invalidateQueries({ queryKey: ['vouchers', selectedCompanyId] });
      toast.success('Invoice saved successfully');
      setTimeout(() => {
        window.location.href = createPageUrl('Sales');
      }, 1000);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save invoice. Please try again.');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'party_ledger_id') {
        const ledger = ledgers.find(l => String(l.id) === String(value));
        if (ledger) {
          updated.party_name = ledger.name;
          updated.billing_address = ledger.address || '';
          updated.customer_type = ledger.customer_type || 'General';
          if (ledger.customer_type === 'VAT Customer') {
            updated.customer_vat_number = ledger.vat_number || '';
            updated.customer_business_name = ledger.business_name || '';
            updated.customer_cr_number = ledger.cr_number || '';
            updated.customer_address_proof = ledger.address_proof || '';
          } else {
            updated.customer_vat_number = '';
            updated.customer_business_name = '';
            updated.customer_cr_number = '';
            updated.customer_address_proof = '';
          }
        }
      }
      return updated;
    });
  };

  const handleItemChange = (index, updatedItem) => {
    setItems(prev => prev.map((item, i) => i === index ? updatedItem : item));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { stock_item_id: '', quantity: 1, rate: 0, discount_percent: 0, vat_rate: 15 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const totals = {
    gross: items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0),
    vat: items.reduce((sum, item) => sum + (parseFloat(item.vat_amount) || 0), 0),
    net: items.reduce((sum, item) => sum + (parseFloat(item.total_amount) || 0), 0),
    discount: items.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0)
  };

  if (isLoadingVoucher && voucherId) return <LoadingSpinner text="Loading invoice..." />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageHeader
        title={voucherId ? 'Edit Sales Invoice' : 'New Sales Invoice'}
        subtitle="Create or edit sales invoice"
        backUrl="Sales"
      />

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Info */}
            <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FormField
                  label="Invoice Number"
                  name="voucher_number"
                  value={formData.voucher_number}
                  onChange={handleChange}
                  placeholder="Auto-generated"
                />
                <FormField
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Reference No"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                />
                <FormField
                  label="Status"
                  name="status"
                  type="select"
                  value={formData.status}
                  onChange={handleChange}
                  options={[
                    { value: 'Draft', label: 'Draft' },
                    { value: 'Confirmed', label: 'Confirmed' },
                    { value: 'Cancelled', label: 'Cancelled' }
                  ]}
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  label="Customer Type"
                  name="customerType"
                  type="select"
                  value={customerType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setCustomerType(newType);
                    setNewCustomer(prev => ({ ...prev, customer_type: newType }));
                    if (!voucherId) {
                      setFormData(prev => ({ ...prev, party_ledger_id: '', party_name: '' }));
                    }
                  }}
                  options={[
                    { value: 'VAT Customer', label: 'VAT Customer' },
                    { value: 'General', label: 'General (Non-VAT Customer)' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormField
                    label="Select Customer"
                    name="party_ledger_id"
                    type="select"
                    value={formData.party_ledger_id}
                    onChange={handleChange}
                    options={partyLedgers.map(l => ({ value: l.id, label: l.name }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowNewCustomerDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Customer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  label="Customer Name"
                  name="party_name"
                  value={formData.party_name}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-4">
                <FormField
                  label="Billing Address"
                  name="billing_address"
                  type="textarea"
                  value={formData.billing_address}
                  onChange={handleChange}
                  rows={2}
                />
              </div>

              {(customerType === 'VAT Customer' ||
                formData.customer_vat_number ||
                formData.customer_business_name ||
                formData.customer_cr_number ||
                formData.customer_address_proof) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-4">VAT Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="VAT Number"
                      name="customer_vat_number"
                      value={formData.customer_vat_number}
                      onChange={handleChange}
                      placeholder="VAT registration number"
                    />
                    <FormField
                      label="Business Name"
                      name="customer_business_name"
                      value={formData.customer_business_name}
                      onChange={handleChange}
                      placeholder="Business/Trading name"
                    />
                    <FormField
                      label="CR Number (Commercial Registration)"
                      name="customer_cr_number"
                      value={formData.customer_cr_number}
                      onChange={handleChange}
                      placeholder="CR number"
                    />
                    <FormField
                      label="Address Proof"
                      name="customer_address_proof"
                      value={formData.customer_address_proof}
                      onChange={handleChange}
                      placeholder="Address proof document reference"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <VoucherItemsTable
                items={items}
                stockItems={stockItems}
                onItemChange={handleItemChange}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                employees={employees}
              />
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-end space-y-2">
                <div className="flex justify-between w-64">
                  <span className="text-slate-600 dark:text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totals.gross, 'SAR')}</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between w-64">
                    <span className="text-slate-600 dark:text-muted-foreground">Discount:</span>
                    <span className="font-medium text-red-600 dark:text-red-400">- {formatCurrency(totals.discount, 'SAR')}</span>
                  </div>
                )}
                <div className="flex justify-between w-64">
                  <span className="text-slate-600 dark:text-muted-foreground">VAT (15%):</span>
                  <span className="font-medium">{formatCurrency(totals.vat, 'SAR')}</span>
                </div>
                <div className="flex justify-between w-64 pt-2 border-t dark:border-border">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totals.net, 'SAR')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Narration */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                label="Narration / Notes"
                name="narration"
                type="textarea"
                value={formData.narration}
                onChange={handleChange}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Narration */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                label="Narration / Notes"
                name="narration"
                type="textarea"
                value={formData.narration}
                onChange={handleChange}
                rows={2}
              />
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Sticky Action Buttons at Bottom */}
        <div className="sticky bottom-0 bg-white dark:bg-card border-t border-slate-200 dark:border-border shadow-lg px-4 md:px-8 py-4 z-10">
          <div className="max-w-6xl mx-auto flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => window.location.href = createPageUrl('Sales')}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Invoice'}
            </Button>
          </div>
        </div>
      </form>

      {/* New Customer Dialog */}
      {showNewCustomerDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Create New Customer</CardTitle>
              <button
                onClick={() => setShowNewCustomerDialog(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <FormField
                  label="Customer Type"
                  name="customer_type"
                  type="select"
                  value={newCustomer.customer_type}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, customer_type: e.target.value }))}
                  options={[
                    { value: 'VAT Customer', label: 'VAT Customer' },
                    { value: 'General', label: 'General (Non-VAT Customer)' }
                  ]}
                />
                <FormField
                  label="Customer Name *"
                  name="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                />
                {newCustomer.customer_type === 'VAT Customer' && (
                  <>
                    <FormField
                      label="VAT Number"
                      name="vat_number"
                      value={newCustomer.vat_number}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, vat_number: e.target.value }))}
                      placeholder="VAT registration number"
                    />
                    <FormField
                      label="Business Name"
                      name="business_name"
                      value={newCustomer.business_name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, business_name: e.target.value }))}
                      placeholder="Business/Trading name"
                    />
                    <FormField
                      label="CR Number (Commercial Registration)"
                      name="cr_number"
                      value={newCustomer.cr_number}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, cr_number: e.target.value }))}
                      placeholder="CR number"
                    />
                    <FormField
                      label="Address Proof"
                      name="address_proof"
                      value={newCustomer.address_proof}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, address_proof: e.target.value }))}
                      placeholder="Address proof document reference"
                    />
                  </>
                )}
                <FormField
                  label="Contact Person"
                  name="contact_person"
                  value={newCustomer.contact_person}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, contact_person: e.target.value }))}
                  placeholder="Contact person name"
                />
                <FormField
                  label="Address"
                  name="address"
                  type="textarea"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Customer address"
                  rows={2}
                />
                <FormField
                  label="City"
                  name="city"
                  value={newCustomer.city}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
                <FormField
                  label="Phone"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
                <FormField
                  label="Email"
                  name="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewCustomerDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => createCustomerMutation.mutate(newCustomer)}
                    disabled={!newCustomer.name || createCustomerMutation.isPending}
                  >
                    {createCustomerMutation.isPending ? 'Creating...' : 'Create Customer'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
