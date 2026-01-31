import React, { useState, useEffect, useRef } from 'react';
import { rcas } from '@/api/rcasClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/context/CompanyContext';
import PageHeader from '@/components/common/PageHeader';
import FormField from '@/components/forms/FormField';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Building2, Save, Upload, X, RotateCw, ZoomIn, ZoomOut, Crop } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompanyInfo() {
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
    logo_url: ''
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
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => rcas.entities.Company.list()
  });

  const company = selectedCompanyId 
    ? companies.find(c => c.id === selectedCompanyId)
    : companies[0];

  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

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
        logo_url: ''
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
          console.log('Creating new company', data);
          const result = await rcas.entities.Company.create(data);
          console.log('Create successful:', result);
          return result;
        }
      } catch (error) {
        console.error('API Call Error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation succeeded:', data);
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('✅ Company information saved successfully');
    },
    onError: (error) => {
      console.error('Save failed:', error);
      toast.error(`❌ ${error?.message || 'Failed to save company information'}`);
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
      />

      {/* Company Selection Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Select Company</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {companies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {companies.map(comp => (
                  <Button
                    key={comp.id}
                    type="button"
                    variant={selectedCompanyId === comp.id ? "default" : "outline"}
                    onClick={() => setSelectedCompanyId(comp.id)}
                    className={cn(
                      selectedCompanyId === comp.id && "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {comp.name}
                  </Button>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
              className="w-full gap-2"
            >
              + Create New Company
            </Button>
          </div>

          {/* New Company Form */}
          {showNewCompanyForm && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">New Company Details</h3>
              <div className="space-y-3">
                <FormField
                  label="Company Name (English)"
                  name="newCompanyName"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter company name"
                />
                <FormField
                  label="Company Name (Arabic)"
                  name="newCompanyNameArabic"
                  value={formData.name_arabic}
                  onChange={(e) => setFormData(prev => ({ ...prev, name_arabic: e.target.value }))}
                  placeholder="أدخل اسم الشركة"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      if (formData.name) {
                        saveMutation.mutate(formData);
                        setShowNewCompanyForm(false);
                      } else {
                        toast.error('Please enter company name');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 flex-1"
                  >
                    Create Company
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCompanyForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">Company Logo</label>
                <p className="text-xs text-slate-500">
                  Recommended size: 200x200px • Format: JPG, PNG • Max size: 2MB
                </p>
                <div className="flex items-start gap-4">
                  {/* Logo Preview */}
                  <div className={cn(
                    "h-32 w-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 relative transition-all duration-300",
                    formData.logo_url 
                      ? "border-emerald-300 bg-emerald-50" 
                      : "border-slate-300 bg-slate-50"
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
                        <p className="text-xs text-slate-500 font-medium">200x200px</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex flex-col gap-3 flex-1">
                    <label className="cursor-pointer">
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200",
                        isUploadingLogo
                          ? "bg-blue-100 border border-blue-300 text-blue-700 cursor-not-allowed"
                          : "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700"
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

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
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
          </div>
        </div>
      </form>

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
                  <label className="text-sm font-medium text-slate-700">Crop</label>
                  {cropMode && cropArea && (
                    <span className="text-xs text-emerald-600 font-medium">
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
                  <p className="text-xs text-slate-500 italic">Click and drag to create crop area</p>
                )}
              </div>

              {/* Rotation */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Rotation</label>
                  <span className="text-sm text-slate-500">{rotation}°</span>
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
                  <label className="text-sm font-medium text-slate-700">Brightness</label>
                  <span className="text-sm text-slate-500">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Contrast</label>
                  <span className="text-sm text-slate-500">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Scale/Zoom */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Scale</label>
                  <span className="text-sm text-slate-500">{scale}%</span>
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
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
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