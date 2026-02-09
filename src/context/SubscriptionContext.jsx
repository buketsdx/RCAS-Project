import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const SubscriptionContext = createContext(null);
const BACKEND_URL = 'http://localhost:3001/api';

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
  const { user } = useAuth();
  const [plan, setPlan] = useState(SUBSCRIPTION_PLANS.FREE);
  const [adUnlocks, setAdUnlocks] = useState({}); // { feature_action: timestamp }

  useEffect(() => {
    const fetchSubscription = async () => {
      // 1. Try fetching from Backend (Only if configured)
      // Check if backend URL is not localhost default or if explicitly enabled
      // For now, we disable backend fetch by default to avoid console errors in frontend-only mode
      const ENABLE_BACKEND = false; 

      if (ENABLE_BACKEND) {
        try {
          const response = await fetch(`${BACKEND_URL}/subscription`, {
            headers: {
              'x-user-id': user?.id || 'guest'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.plan) {
              setPlan(data.plan);
              localStorage.setItem('rcas_subscription_plan', data.plan); // Sync local
              return;
            }
          }
        } catch (err) {
          // Backend offline, ignore
        }
      }

      // 2. Fallback to LocalStorage
      const savedPlan = localStorage.getItem('rcas_subscription_plan');
      if (savedPlan) {
        setPlan(savedPlan);
      }
    };

    fetchSubscription();
  }, [user]);

  const upgradeToPremium = async () => {
    // Optimistic Update
    setPlan(SUBSCRIPTION_PLANS.PREMIUM);
    localStorage.setItem('rcas_subscription_plan', SUBSCRIPTION_PLANS.PREMIUM);
    
    try {
      await fetch(`${BACKEND_URL}/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'guest'
        },
        body: JSON.stringify({ plan: SUBSCRIPTION_PLANS.PREMIUM })
      });
      toast.success('Upgraded to Premium! All features unlocked.');
    } catch (err) {
      toast.warning('Premium activated locally (Server Offline)');
    }
  };

  const downgradeToFree = async () => {
    // Optimistic Update
    setPlan(SUBSCRIPTION_PLANS.FREE);
    localStorage.setItem('rcas_subscription_plan', SUBSCRIPTION_PLANS.FREE);
    
    try {
      await fetch(`${BACKEND_URL}/subscription/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || 'guest'
        }
      });
      toast.info('Downgraded to Free plan.');
    } catch (err) {
      toast.info('Downgraded locally.');
    }
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
