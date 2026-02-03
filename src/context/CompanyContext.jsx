import React, { createContext, useContext, useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingCompanyId, setPendingCompanyId] = useState(null);

  const { data: allCompanies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => rcas.entities.Company.list(),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter companies based on user access
  const companies = React.useMemo(() => {
    if (!user) return [];
    
    let accessibleCompanies = [];
    if (user.role === 'Super Admin') {
      accessibleCompanies = allCompanies;
    } else if (user.allowed_companies && user.allowed_companies.length > 0) {
      accessibleCompanies = allCompanies.filter(c => user.allowed_companies.includes(c.id));
    } else {
      // Fix for demo: If user is admin/owner but has no array, give access to all (Legacy fix)
      if (user.role === 'Admin' || user.role === 'Owner') {
         accessibleCompanies = allCompanies;
      } else {
         accessibleCompanies = [];
      }
    }
    return accessibleCompanies;
  }, [user, allCompanies]);

  // Set first company as default if not already set
  useEffect(() => {
    if (companies.length > 0 && !selectedCompanyId) {
      // Check if we have a stored preference
      const storedId = localStorage.getItem('rcas_selected_company_id');
      const companyToSelect = companies.find(c => c.id === storedId) || companies[0];
      
      setSelectedCompanyId(companyToSelect.id);
      rcas.setContext({ companyId: companyToSelect.id });
    }
  }, [companies, selectedCompanyId]);

  const currentCompany = companies.find(c => c.id === selectedCompanyId);

  const handleSetCompany = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    
    if (!company) return;

    // If company has password, ask for it
    if (company.password) {
      setPendingCompanyId(companyId);
      setPasswordInput('');
      setShowPasswordDialog(true);
    } else {
      // No password, switch directly
      setSelectedCompanyId(companyId);
      localStorage.setItem('rcas_selected_company_id', companyId);
      rcas.setContext({ companyId });
      toast.success(`Switched to ${company.name}`);
    }
  };

  const verifyPassword = () => {
    const company = companies.find(c => c.id === pendingCompanyId);
    
    if (passwordInput === company.password) {
      setSelectedCompanyId(pendingCompanyId);
      localStorage.setItem('rcas_selected_company_id', pendingCompanyId);
      rcas.setContext({ companyId: pendingCompanyId });
      setShowPasswordDialog(false);
      setPasswordInput('');
      setPendingCompanyId(null);
      toast.success(`Switched to ${company.name}`);
    } else {
      toast.error('Incorrect password');
      setPasswordInput('');
    }
  };

  return (
    <CompanyContext.Provider 
      value={{
        selectedCompanyId,
        setSelectedCompanyId: handleSetCompany,
        currentCompany,
        companies,
        isLoading,
        showPasswordDialog,
        setShowPasswordDialog,
        pendingCompanyId,
        passwordInput,
        setPasswordInput,
        verifyPassword
      }}
    >
      {children}
      
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Company Password</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={verifyPassword}>Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
}
