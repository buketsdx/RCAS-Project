import React, { useState, useEffect, useRef } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import DataTable from '@/components/common/DataTable';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Save, Upload, X, RotateCw, ZoomIn, ZoomOut, Crop, Trash2, Check, ArrowRightLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompanyInfo() {
  console.log("Rendering CompanyInfo Component");
  const queryClient = useQueryClient();
  const { selectedCompanyId, setSelectedCompanyId, companies: contextCompanies, isLoading: contextLoading } = useCompany();
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
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
    logo_url: '',
    business_type: 'Retail'
  });
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [scale, setScale] = useState(100);
  const [cropMode, setCropMode] = useState(false);
  const [cropArea, setCropArea] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMode, setDragMode] = useState(null);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showNewCompanyDialog, setShowNewCompanyDialog] = useState(false);
  const [newCompanyData, setNewCompanyData] = useState({ name: '', name_arabic: '' });
  const [showEditCompanyDialog, setShowEditCompanyDialog] = useState(false);
  const [defaultCompanyId, setDefaultCompanyId] = useState(localStorage.getItem('rcas_default_company_id'));

  const { data: companies = [], isLoading, isRefetching } = useQuery({
    queryKey: ['companies'],
    queryFn: () => rcas.entities.Company.list()
  });

  const company = selectedCompanyId 
    ? companies.find(c => c.id === selectedCompanyId)
    : companies[0];

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
        logo_url: company.logo_url || '',
        business_type: company.business_type || 'Retail'
      });
    } else {
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
        logo_url: '',
        business_type: 'Retail'
      });
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Attempting to save company data:', { company, data });
      try {
        if (company) {
          console.log(`Updating company ID: ${company.id}`, data);
          const result = await rcas.entities.Company.update(company.id, data);
          console.log('Update successful:', result);
          return result;
        } else {
          // This path might be unused if we use createMutation for new companies
          console.log('Creating new company via saveMutation', data);
          const result = await rcas.entities.Company.create(data);
          console.log('Create successful:', result);
          return result;
        }
      } catch (error) {
        console.error('API Call Error in saveMutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Save mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('✅ Company information saved successfully');
    },
    onError: (error) => {
      console.error('Save failed:', error);
      toast.error(`❌ ${error?.message || 'Failed to save company information'}`);
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Attempting to create company:', data);
      try {
        const result = await rcas.entities.Company.create(data);
        console.log('Company created result:', result);
        return result;
      } catch (error) {
        console.error('Error creating company:', error);
        throw error;
      }
    },
    onSuccess: (newCompany) => {
      console.log('Create mutation success, new company:', newCompany);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('✅ Company created successfully');
      setShowNewCompanyDialog(false);
      setNewCompanyData({ name: '', name_arabic: '' });
      // Automatically switch to the new company
      if (newCompany && newCompany.id) {
        setSelectedCompanyId(newCompany.id);
      }
    },
    onError: (error) => {
      console.error('Create mutation error:', error);
      toast.error(`❌ ${error?.message || 'Failed to create company'}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await rcas.entities.Company.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('✅ Company deleted successfully');
      // If deleted company was selected, switch to another one if available
      if (companies.length > 0) {
        const remaining = companies.filter(c => c.id !== selectedCompanyId);
        if (remaining.length > 0) {
          setSelectedCompanyId(remaining[0].id);
        } else {
          setSelectedCompanyId(null);
        }
      }
    },
    onError: (error) => {
      toast.error(`❌ ${error?.message || 'Failed to delete company'}`);
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData, {
      onSuccess: () => setShowEditCompanyDialog(false)
    });
  };

  const handleCreateSubmit = () => {
    if (!newCompanyData.name) {
      toast.error('Please enter company name');
      return;
    }
    createMutation.mutate(newCompanyData);
  };

  const columns = [
    { 
      header: 'Company Name', 
      accessor: 'name', 
      render: (row) => (
        <div className="flex flex-col">
          <span className={cn("font-medium", row.id === selectedCompanyId && "text-emerald-700 dark:text-emerald-400 font-bold")}>
            {row.name}
          </span>
          {row.name_arabic && <span className="text-xs text-muted-foreground">{row.name_arabic}</span>}
        </div>
      )
    },
    { 
      header: 'Business Type', 
      accessor: 'business_type',
      render: (row) => (
        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 dark:text-slate-200">
          {row.business_type || 'Retail'}
        </Badge>
      )
    },
    { header: 'City', accessor: 'city' },
    { header: 'Phone', accessor: 'phone' },
    { 
      header: 'Status', 
      render: (row) => (
        row.id === selectedCompanyId ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40">
            <Check className="h-3 w-3 mr-1" /> Active
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">Inactive</span>
        )
      ) 
    },
    { 
      header: 'Actions', 
      render: (row) => {
        const isDefault = defaultCompanyId === row.id;

        return (
          <div className="flex gap-2 items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedCompanyId(row.id);
                setShowEditCompanyDialog(true);
              }}
            >
              <Settings className="h-3 w-3 mr-1" /> Edit
            </Button>
            {row.id !== selectedCompanyId && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCompanyId(row.id);
                  toast.success(`Switched to ${row.name}`);
                }}
              >
                <ArrowRightLeft className="h-3 w-3 mr-1" /> Switch
              </Button>
            )}
            
            <div className="flex items-center space-x-2 ml-2 border-l pl-2 border-slate-200 dark:border-slate-700">
              <Switch
                id={`default-company-${row.id}`}
                checked={isDefault}
                onCheckedChange={(checked) => {
                   if (checked) {
                     localStorage.setItem('rcas_default_company_id', row.id);
                     setDefaultCompanyId(row.id);
                     toast.success(`${row.name} is now the default company`);
                   } else {
                     localStorage.removeItem('rcas_default_company_id');
                     setDefaultCompanyId(null);
                     toast.info('Default company cleared');
                   }
                }}
              />
              <Label htmlFor={`default-company-${row.id}`} className="text-xs cursor-pointer">
                {isDefault ? 'Default' : 'Set Default'}
              </Label>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 ml-auto"
              onClick={(e) => { 
                e.stopPropagation(); 
                if (companies.length <= 1) {
                  toast.error("Cannot delete the only company");
                  return;
                }
                if(confirm(`Are you sure you want to delete ${row.name}? This action cannot be undone.`)) {
                  deleteMutation.mutate(row.id);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      }
    }
  ];

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo size must be less than 2MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    try {
      setIsUploadingLogo(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target.result;
        setEditingImage(base64String);
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setScale(100);
        setShowImageEditor(true);
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(`Failed to upload logo: ${error?.message}`);
      setIsUploadingLogo(false);
    }
  };

  const applyImageAdjustments = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) scale(${scale / 100})`;
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        const editedBase64 = canvas.toDataURL('image/jpeg', 0.95);
        setFormData(prev => ({ ...prev, logo_url: editedBase64 }));
        setLogoUploadSuccess(true);
        setShowImageEditor(false);
        setEditingImage(null);
        toast.success('✅ Logo edited and saved!');
        setTimeout(() => setLogoUploadSuccess(false), 3000);
      };
      img.src = editingImage;
    } catch (error) {
      toast.error(`Failed to apply adjustments: ${error?.message}`);
    }
  };

  const resetImageAdjustments = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setScale(100);
    setCropArea(null);
  };

  const handleMouseDown = (e) => {
    if (!cropMode || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const imgElement = previewRef.current.querySelector('img');
    if (!imgElement) return;

    const imgRect = imgElement.getBoundingClientRect();
    const relX = e.clientX - imgRect.left;
    const relY = e.clientY - imgRect.top;

    const offsetX = imgRect.left - rect.left;
    const offsetY = imgRect.top - rect.top;

    setImageOffset({
      x: offsetX,
      y: offsetY,
      width: imgRect.width,
      height: imgRect.height
    });

    // Check if clicking on existing crop area (move or resize)
    if (cropArea) {
      const cropScreenX = cropArea.x + offsetX;
      const cropScreenY = cropArea.y + offsetY;
      const cropScreenW = cropArea.width;
      const cropScreenH = cropArea.height;
      const handle = 8;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Check corners for resize
      if (Math.abs(mouseX - cropScreenX) < handle && Math.abs(mouseY - cropScreenY) < handle) {
        setDragMode('resize-nw');
      } else if (Math.abs(mouseX - (cropScreenX + cropScreenW)) < handle && Math.abs(mouseY - cropScreenY) < handle) {
        setDragMode('resize-ne');
      } else if (Math.abs(mouseX - cropScreenX) < handle && Math.abs(mouseY - (cropScreenY + cropScreenH)) < handle) {
        setDragMode('resize-sw');
      } else if (Math.abs(mouseX - (cropScreenX + cropScreenW)) < handle && Math.abs(mouseY - (cropScreenY + cropScreenH)) < handle) {
        setDragMode('resize-se');
      }
      // Check if clicking inside crop box
      else if (
        mouseX >= cropScreenX && mouseX <= cropScreenX + cropScreenW &&
        mouseY >= cropScreenY && mouseY <= cropScreenY + cropScreenH
      ) {
        setDragMode('move');
      } else {
        // Outside crop box, start new crop
        setDragMode('draw');
      }
    } else {
      // No crop area yet, start drawing
      setDragMode('draw');
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!cropMode || !isDragging || !previewRef.current) return;

    const rect = previewRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const deltaX = currentX - dragStart.x;
    const deltaY = currentY - dragStart.y;

    if (dragMode === 'draw') {
      // Drawing new crop box
      const newArea = {
        x: Math.max(0, Math.min(dragStart.x - imageOffset.x, currentX - imageOffset.x)),
        y: Math.max(0, Math.min(dragStart.y - imageOffset.y, currentY - imageOffset.y)),
        width: Math.abs(currentX - dragStart.x),
        height: Math.abs(currentY - dragStart.y)
      };
      setCropArea(newArea);
    } else if (dragMode === 'move' && cropArea) {
      // Moving existing crop box
      const newArea = {
        ...cropArea,
        x: Math.max(0, Math.min(cropArea.x + deltaX, imageOffset.width - cropArea.width)),
        y: Math.max(0, Math.min(cropArea.y + deltaY, imageOffset.height - cropArea.height))
      };
      setCropArea(newArea);
      setDragStart({ x: currentX, y: currentY });
    } else if (dragMode?.startsWith('resize') && cropArea) {
      // Resizing crop box
      let newArea = { ...cropArea };

      if (dragMode === 'resize-nw') {
        newArea.x = Math.max(0, cropArea.x + deltaX);
        newArea.y = Math.max(0, cropArea.y + deltaY);
        newArea.width = Math.max(20, cropArea.width - deltaX);
        newArea.height = Math.max(20, cropArea.height - deltaY);
      } else if (dragMode === 'resize-ne') {
        newArea.y = Math.max(0, cropArea.y + deltaY);
        newArea.width = Math.max(20, cropArea.width + deltaX);
        newArea.height = Math.max(20, cropArea.height - deltaY);
      } else if (dragMode === 'resize-sw') {
        newArea.x = Math.max(0, cropArea.x + deltaX);
        newArea.width = Math.max(20, cropArea.width - deltaX);
        newArea.height = Math.max(20, cropArea.height + deltaY);
      } else if (dragMode === 'resize-se') {
        newArea.width = Math.max(20, cropArea.width + deltaX);
        newArea.height = Math.max(20, cropArea.height + deltaY);
      }

      setCropArea(newArea);
      setDragStart({ x: currentX, y: currentY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  const applyCrop = () => {
    if (!cropArea || !editingImage) return;

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.95);
      setEditingImage(croppedBase64);
      setCropArea(null);
      setCropMode(false);
      toast.success('✓ Image cropped');
    };
    img.src = editingImage;
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading company information..." />;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader 
        title="Company Information" 
        subtitle="Manage your company details and settings"
        primaryAction={{
          label: 'Add Company',
          onClick: () => setShowNewCompanyDialog(true)
        }}
        secondaryActions={
          <Button 
            variant="outline" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['companies'] })}
            className="gap-2"
            disabled={isRefetching}
          >
            <RotateCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            {isRefetching ? 'Refreshing...' : 'Refresh List'}
          </Button>
        }
      />

      <div className="mb-8">
        <DataTable 
          columns={columns} 
          data={companies} 
          searchKey="name"
          pageSize={50}
          onRowClick={(row) => setSelectedCompanyId(row.id)}
          emptyMessage="No companies found. Create a new company to get started."
        />
      </div>

      <Dialog open={showEditCompanyDialog} onOpenChange={setShowEditCompanyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Edit Details: {company?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Business Type"
                    name="business_type"
                    type="select"
                    value={formData.business_type}
                    onChange={handleChange}
                    options={[
                      { value: 'Retail', label: 'Retail' },
                      { value: 'Salon', label: 'Salon / Spa' },
                      { value: 'Restaurant', label: 'Restaurant / Cafe' },
                      { value: 'Service', label: 'Service Provider' },
                      { value: 'Wholesale', label: 'Wholesale / Distribution' },
                      { value: 'Manufacturing', label: 'Manufacturing' },
                      { value: 'Other', label: 'Other' }
                    ]}
                    hint="Select your business type to customize the interface"
                  />
                </div>
                
                {/* Logo Upload */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company Logo</label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Recommended size: 200x200px • Format: JPG, PNG • Max size: 2MB
                  </p>
                  <div className="flex items-start gap-4">
                    {/* Logo Preview */}
                    <div className={cn(
                      "h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 relative transition-all duration-300",
                      formData.logo_url 
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-700" 
                        : "border-slate-300 bg-slate-50 dark:bg-slate-900 dark:border-slate-700"
                    )}>
                      {formData.logo_url ? (
                        <>
                          <img 
                            src={formData.logo_url} 
                            alt="Company Logo" 
                            className="h-full w-full object-contain p-2"
                          />
                          {logoUploadSuccess && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center rounded-lg animate-pulse">
                              <div className="text-4xl">✓</div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="text-3xl mb-1">📷</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">200x200px</p>
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="flex flex-col gap-3 flex-1">
                      <label className="cursor-pointer">
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
                          isUploadingLogo
                            ? "bg-blue-100 border border-blue-300 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400 cursor-not-allowed"
                            : "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400"
                        )}>
                          {isUploadingLogo ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                              <span className="text-sm font-medium">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span className="text-sm font-medium">Choose Logo</span>
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp" 
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>
                      {isUploadingLogo && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                          <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          Uploading logo...
                        </div>
                      )}
                      {formData.logo_url && !isUploadingLogo && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Logo
                        </Button>
                      )}
                      {logoUploadSuccess && !isUploadingLogo && (
                        <div className="text-xs text-emerald-600 font-medium animate-pulse">
                          ✓ Logo uploaded successfully!
                        </div>
                      )}
                    </div>
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
            
            <DialogFooter className="gap-3">
               {saveMutation.isSuccess && (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium">
                  ✓ Saved successfully
                </div>
              )}
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                disabled={saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
      </Dialog>

      <Dialog open={showNewCompanyDialog} onOpenChange={setShowNewCompanyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <FormField
              label="Company Name (English)"
              name="name"
              value={newCompanyData.name}
              onChange={(e) => setNewCompanyData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter company name"
            />
            <FormField
              label="Company Name (Arabic)"
              name="name_arabic"
              value={newCompanyData.name_arabic}
              onChange={(e) => setNewCompanyData(prev => ({ ...prev, name_arabic: e.target.value }))}
              placeholder="أدخل اسم الشركة"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCompanyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateSubmit} className="bg-emerald-600 hover:bg-emerald-700">Create Company</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Editor Modal */}
      <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Logo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Canvas Preview */}
            <div 
              ref={previewRef}
              className={cn(
                "flex justify-center bg-slate-100 rounded-lg p-6 relative overflow-hidden cursor-crosshair",
                cropMode ? "border-2 border-emerald-500" : ""
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ userSelect: 'none' }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  display: 'none'
                }}
              />
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={editingImage}
                  alt="Logo Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '300px',
                    transform: `rotate(${rotation}deg) scale(${scale / 100})`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    transition: 'all 0.2s ease-in-out',
                    opacity: cropMode ? 0.7 : 1,
                    cursor: cropMode ? 'crosshair' : 'default'
                  }}
                  className="object-contain"
                />
                
                {/* Crop Overlay */}
                {cropMode && cropArea && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${cropArea.x}px`,
                      top: `${cropArea.y}px`,
                      width: `${cropArea.width}px`,
                      height: `${cropArea.height}px`,
                      border: '2px solid #10b981',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                      cursor: 'move',
                      pointerEvents: 'auto'
                    }}
                  >
                    {/* Corner handles - NW */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid white',
                        top: '-8px',
                        left: '-8px',
                        cursor: 'nwse-resize',
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                      }} 
                    />
                    {/* Corner handles - NE */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid white',
                        top: '-8px',
                        right: '-8px',
                        cursor: 'nesw-resize',
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                      }} 
                    />
                    {/* Corner handles - SW */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid white',
                        bottom: '-8px',
                        left: '-8px',
                        cursor: 'nesw-resize',
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                      }} 
                    />
                    {/* Corner handles - SE */}
                    <div 
                      style={{ 
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        backgroundColor: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid white',
                        bottom: '-8px',
                        right: '-8px',
                        cursor: 'nwse-resize',
                        boxShadow: '0 0 4px rgba(0,0,0,0.3)'
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {/* Crop Tool */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Crop</label>
                  {cropMode && cropArea && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {Math.round(cropArea.width)} × {Math.round(cropArea.height)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={cropMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCropMode(!cropMode);
                      setCropArea(null);
                    }}
                    className={cn(
                      "gap-2",
                      cropMode && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    <Crop className="h-4 w-4" />
                    {cropMode ? "Drawing..." : "Enable Crop"}
                  </Button>
                  {cropMode && cropArea && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyCrop}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Apply Crop
                    </Button>
                  )}
                </div>
                {cropMode && !cropArea && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">Click and drag to create crop area</p>
                )}
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rotation</label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{rotation}°</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    Rotate 90°
                  </Button>
                </div>
              </div>

              {/* Brightness */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Brightness</label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contrast</label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Scale/Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Scale</label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{scale}%</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.max(50, scale - 10))}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.min(150, scale + 10))}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetImageAdjustments}
            >
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowImageEditor(false);
                setEditingImage(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={applyImageAdjustments}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              Apply & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}