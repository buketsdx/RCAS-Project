import React, { createContext, useContext, useState, useEffect } from 'react';
import { rcas } from '@/api/rcasClient';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from './AuthContext';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingCompanyId, setPendingCompanyId] = useState(null);

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const allCompanies = await rcas.entities.Company.list();
        
        // Filter companies based on user access
        let accessibleCompanies = [];
        if (user?.role === 'Super Admin') {
          accessibleCompanies = allCompanies;
        } else if (user?.allowed_companies) {
          accessibleCompanies = allCompanies.filter(c => user.allowed_companies.includes(c.id));
        } else {
          // If no allowed_companies defined but not super admin, maybe allow none? 
          // Or for backward compatibility, allow all? 
          // Strict mode: allow none. But let's check if user is creator?
          // For now, if user has NO allowed_companies array (legacy users), we might want to allow access or migrate them.
          // Let's assume strict:
          accessibleCompanies = [];
        }

        // Fix for demo: If user is admin but has no array, give access to all (Legacy fix)
        if (user && !user.allowed_companies && user.role === 'Admin') {
           accessibleCompanies = allCompanies;
        }

        setCompanies(accessibleCompanies || []);
        
        // Set first company as default if not already set
        if (accessibleCompanies?.length > 0 && !selectedCompanyId) {
          const defaultId = accessibleCompanies[0].id;
          setSelectedCompanyId(defaultId);
          rcas.setContext({ companyId: defaultId });
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadCompanies();
    } else {
      setIsLoading(false);
    }
  }, [user]);

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
      rcas.setContext({ companyId });
      toast.success(`Switched to ${company.name}`);
    }
  };

  const verifyPassword = () => {
    const company = companies.find(c => c.id === pendingCompanyId);
    
    if (passwordInput === company.password) {
      setSelectedCompanyId(pendingCompanyId);
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
