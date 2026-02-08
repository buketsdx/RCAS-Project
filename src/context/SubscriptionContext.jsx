import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const SubscriptionContext = createContext(null);

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM: 'premium'
};

export const FEATURE_LIMITS = {
  waste_tracker: {
    max_entries_per_month: 5,
    allow_export: false
  },
  supplier_comparison: {
    max_suppliers: 2,
    allow_detailed_analytics: false
  },
  custody_wallet: {
    max_wallets: 1,
    max_transactions_per_month: 10,
    allow_export: false
  }
};

export const SubscriptionProvider = ({ children }) => {
  const [plan, setPlan] = useState(SUBSCRIPTION_PLANS.FREE);
  const [adUnlocks, setAdUnlocks] = useState({}); // { feature_action: timestamp }

  useEffect(() => {
    // Load subscription status from localStorage
    const savedPlan = localStorage.getItem('rcas_subscription_plan');
    if (savedPlan) {
      setPlan(savedPlan);
    }
  }, []);

  const upgradeToPremium = () => {
    setPlan(SUBSCRIPTION_PLANS.PREMIUM);
    localStorage.setItem('rcas_subscription_plan', SUBSCRIPTION_PLANS.PREMIUM);
    toast.success('Upgraded to Premium! All features unlocked.');
  };

  const downgradeToFree = () => {
    setPlan(SUBSCRIPTION_PLANS.FREE);
    localStorage.setItem('rcas_subscription_plan', SUBSCRIPTION_PLANS.FREE);
    toast.info('Downgraded to Free plan.');
  };

  const unlockWithAd = (actionKey) => {
    // Grant temporary access (e.g., 1 hour)
    setAdUnlocks(prev => ({
      ...prev,
      [actionKey]: Date.now() + 60 * 60 * 1000 // 1 hour expiry
    }));
    toast.success('Feature unlocked temporarily!');
  };

  const hasAdAccess = (actionKey) => {
    const expiry = adUnlocks[actionKey];
    if (!expiry) return false;
    return Date.now() < expiry;
  };

  return (
    <SubscriptionContext.Provider value={{ 
      plan, 
      isPremium: plan === SUBSCRIPTION_PLANS.PREMIUM,
      upgradeToPremium, 
      downgradeToFree,
      unlockWithAd,
      hasAdAccess
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
