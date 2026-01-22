import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save, Database, FileText, Calculator, Globe } from 'lucide-react';

export default function AppSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    vat_rate: '15',
    invoice_prefix: 'INV',
    purchase_prefix: 'PUR',
    receipt_prefix: 'REC',
    payment_prefix: 'PAY',
    date_format: 'dd/MM/yyyy',
    currency_symbol: 'SAR',
    decimal_places: '2',
    fiscal_year_start: '01',
    enable_inventory: true,
    enable_payroll: true,
    enable_cost_centers: false,
    auto_voucher_numbering: true,
    require_narration: false
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="App Settings" subtitle="Configure system preferences" />

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-600" />
              General Settings
            </CardTitle>
            <CardDescription>Basic application configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Default VAT Rate (%)"
                name="vat_rate"
                type="select"
                value={settings.vat_rate}
                onChange={(e) => handleChange('vat_rate', e.target.value)}
                options={[
                  { value: '15', label: '15% (Standard)' },
                  { value: '5', label: '5%' },
                  { value: '0', label: '0% (Zero Rated)' }
                ]}
              />
              <FormField
                label="Currency Symbol"
                name="currency_symbol"
                value={settings.currency_symbol}
                onChange={(e) => handleChange('currency_symbol', e.target.value)}
              />
              <FormField
                label="Decimal Places"
                name="decimal_places"
                type="select"
                value={settings.decimal_places}
                onChange={(e) => handleChange('decimal_places', e.target.value)}
                options={[
                  { value: '0', label: '0' },
                  { value: '2', label: '2' },
                  { value: '3', label: '3' }
                ]}
              />
            </div>
            <FormField
              label="Fiscal Year Start Month"
              name="fiscal_year_start"
              type="select"
              value={settings.fiscal_year_start}
              onChange={(e) => handleChange('fiscal_year_start', e.target.value)}
              options={[
                { value: '01', label: 'January' },
                { value: '04', label: 'April' },
                { value: '07', label: 'July' }
              ]}
            />
          </CardContent>
        </Card>

        {/* Voucher Numbering */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Voucher Numbering
            </CardTitle>
            <CardDescription>Configure voucher number prefixes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                label="Sales Invoice Prefix"
                name="invoice_prefix"
                value={settings.invoice_prefix}
                onChange={(e) => handleChange('invoice_prefix', e.target.value)}
              />
              <FormField
                label="Purchase Invoice Prefix"
                name="purchase_prefix"
                value={settings.purchase_prefix}
                onChange={(e) => handleChange('purchase_prefix', e.target.value)}
              />
              <FormField
                label="Receipt Prefix"
                name="receipt_prefix"
                value={settings.receipt_prefix}
                onChange={(e) => handleChange('receipt_prefix', e.target.value)}
              />
              <FormField
                label="Payment Prefix"
                name="payment_prefix"
                value={settings.payment_prefix}
                onChange={(e) => handleChange('payment_prefix', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Module Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Module Settings
            </CardTitle>
            <CardDescription>Enable or disable features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Inventory Management</Label>
                <p className="text-sm text-slate-500">Track stock items and quantities</p>
              </div>
              <Switch
                checked={settings.enable_inventory}
                onCheckedChange={(checked) => handleChange('enable_inventory', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Payroll Management</Label>
                <p className="text-sm text-slate-500">Manage employee salaries and GOSI</p>
              </div>
              <Switch
                checked={settings.enable_payroll}
                onCheckedChange={(checked) => handleChange('enable_payroll', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Cost Centers</Label>
                <p className="text-sm text-slate-500">Track expenses by cost centers</p>
              </div>
              <Switch
                checked={settings.enable_cost_centers}
                onCheckedChange={(checked) => handleChange('enable_cost_centers', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Voucher Numbering</Label>
                <p className="text-sm text-slate-500">Automatically generate voucher numbers</p>
              </div>
              <Switch
                checked={settings.auto_voucher_numbering}
                onCheckedChange={(checked) => handleChange('auto_voucher_numbering', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Narration</Label>
                <p className="text-sm text-slate-500">Make narration mandatory for vouchers</p>
              </div>
              <Switch
                checked={settings.require_narration}
                onCheckedChange={(checked) => handleChange('require_narration', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              About RCAS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-slate-600">
              <p><strong>Software:</strong> RCAS (Rustam Chartered Account System)</p>
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Developer:</strong> Rustam Ali</p>
              <p><strong>Region:</strong> Saudi Arabia (KSA)</p>
              <p><strong>Compliance:</strong> ZATCA VAT Regulations</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}