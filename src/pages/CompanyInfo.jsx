import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Save, Upload } from 'lucide-react';

export default function CompanyInfo() {
  const queryClient = useQueryClient();
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
    logo_url: ''
  });

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const company = companies[0];

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        name_arabic: company.name_arabic || '',
        address: company.address || '',
        city: company.city || '',
        country: company.country || 'Saudi Arabia',
        postal_code: company.postal_code || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        vat_number: company.vat_number || '',
        cr_number: company.cr_number || '',
        financial_year_start: company.financial_year_start || '',
        financial_year_end: company.financial_year_end || '',
        currency: company.currency || 'SAR',
        logo_url: company.logo_url || ''
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (company) {
        return base44.entities.Company.update(company.id, data);
      } else {
        return base44.entities.Company.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company information saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save company information');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, logo_url: file_url }));
      toast.success('Logo uploaded successfully');
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading company information..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Company Information" 
        subtitle="Manage your company details and settings"
      />

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Company Name (English)"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <FormField
                  label="Company Name (Arabic)"
                  name="name_arabic"
                  value={formData.name_arabic}
                  onChange={handleChange}
                />
              </div>
              
              {/* Logo Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Company Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    <img 
                      src={formData.logo_url} 
                      alt="Company Logo" 
                      className="h-16 w-16 object-contain rounded-lg border border-slate-200"
                    />
                  )}
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      <Upload className="h-4 w-4" />
                      <span className="text-sm">Upload Logo</span>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                label="Address"
                name="address"
                type="textarea"
                value={formData.address}
                onChange={handleChange}
                rows={2}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
                <FormField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                />
                <FormField
                  label="Postal Code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <FormField
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Legal & Tax Information */}
          <Card>
            <CardHeader>
              <CardTitle>Legal & Tax Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="VAT Registration Number"
                  name="vat_number"
                  value={formData.vat_number}
                  onChange={handleChange}
                  hint="15-digit VAT number for Saudi Arabia"
                />
                <FormField
                  label="Commercial Registration (CR) Number"
                  name="cr_number"
                  value={formData.cr_number}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}