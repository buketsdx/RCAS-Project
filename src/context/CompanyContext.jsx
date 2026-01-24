import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const CompanyContext = createContext();

export function CompanyProvider({ children }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingCompanyId, setPendingCompanyId] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await base44.entities.Company.list();
        setCompanies(data || []);
        
        // Set first company as default if not already set
        if (data?.length > 0 && !selectedCompanyId) {
          setSelectedCompanyId(data[0].id);
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const currentCompany = companies.find(c => c.id === selectedCompanyId);

  const handleSetCompany = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    
    // If company has password, ask for it
    if (company?.password) {
      setPendingCompanyId(companyId);
      setPasswordInput('');
      setShowPasswordDialog(true);
    } else {
      // No password, switch directly
      setSelectedCompanyId(companyId);
      toast.success(`Switched to ${company.name}`);
    }
  };

  const verifyPassword = () => {
    const company = companies.find(c => c.id === pendingCompanyId);
    
    if (passwordInput === company.password) {
      setSelectedCompanyId(pendingCompanyId);
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
