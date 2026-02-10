import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { rcas } from '@/api/rcasClient';

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
  const [productId, setProductId] = useState(localStorage.getItem('rcas_product_id') || null);
  const [adUnlocks, setAdUnlocks] = useState({}); // { feature_action: timestamp }

  // Valid Product IDs (Mock Database)
  const VALID_PRODUCT_IDS = ['RCAS-PRO-2024', 'PREMIUM-KEY-123', 'RCAS-LIFETIME'];

  useEffect(() => {
    // 0. Super Admin Bypass
    if (user?.role === 'super_admin') {
      setPlan(SUBSCRIPTION_PLANS.PREMIUM);
      return;
    }

    const fetchSubscription = async () => {
      // 1. Check Backend for Claimed Keys (Secure Source of Truth)
      if (user) {
        try {
          // Using rcas.from for direct DB access
          const { data, error } = await rcas
            .from('subscription_keys')
            .select('plan_type, key_code')
            .eq('claimed_by', user.id)
            .eq('status', 'used')
            .maybeSingle();

          if (data) {
            setPlan(SUBSCRIPTION_PLANS.PREMIUM);
            setProductId(data.key_code);
            return;
          }
        } catch (err) {
          console.error("Error fetching subscription from Backend:", err);
        }
      }

      // 2. Fallback: Check Local Product ID (Mock Database / Legacy)
      if (productId && VALID_PRODUCT_IDS.includes(productId)) {
        setPlan(SUBSCRIPTION_PLANS.PREMIUM);
        return;
      }

      // 3. Try fetching from Legacy Backend (Only if configured)
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

      // 4. Fallback to LocalStorage Preference
      const savedPlan = localStorage.getItem('rcas_subscription_plan');
      if (savedPlan) {
        setPlan(savedPlan);
      }
    };

    fetchSubscription();
  }, [user, productId]);

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

  const activateProduct = async (key) => {
    // 1. Try Backend RPC first (Secure)
    try {
      const { data, error } = await rcas.rpc('claim_subscription_key', { input_key: key });
      
      if (!error && data?.success) {
        setProductId(key);
        setPlan(SUBSCRIPTION_PLANS.PREMIUM);
        localStorage.setItem('rcas_product_id', key);
        toast.success(data.message || 'Product Key Activated! Welcome to Premium.');
        return true;
      }

      // If specific error from backend
      if (data?.success === false) {
        toast.error(data.message);
        // Don't fallback if backend explicitly rejected it
        return false;
      }
      
      if (error) {
        console.warn("Backend RPC failed or not found, falling back to local check (Dev only)", error);
      }
    } catch (err) {
      console.error("Activation error:", err);
    }

    // 2. Fallback to Local (for development/demo/offline)
    if (VALID_PRODUCT_IDS.includes(key)) {
      setProductId(key);
      setPlan(SUBSCRIPTION_PLANS.PREMIUM);
      localStorage.setItem('rcas_product_id', key);
      toast.success('Product Key Activated! Welcome to Premium (Local Mode).');
      return true;
    } else {
      toast.error('Invalid Product Key.');
      return false;
    }
  };

  const buyPremium = async () => {
    try {
      // Simulate Payment Process
      const { data, error } = await rcas.rpc('process_mock_payment', { payment_amount: 49.00 });
      
      if (error) throw error;

      if (data?.success) {
        setProductId(data.key);
        setPlan(SUBSCRIPTION_PLANS.PREMIUM);
        localStorage.setItem('rcas_product_id', data.key);
        return { success: true, key: data.key };
      } else {
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (err) {
      console.error("Payment error:", err);
      toast.error("Payment processing failed. Please try again.");
      return { success: false };
    }
  };

  const removeProduct = () => {
    setProductId(null);
    setPlan(SUBSCRIPTION_PLANS.FREE);
    localStorage.removeItem('rcas_product_id');
    toast.info('Product Key removed. Reverted to Free plan.');
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
      activateProduct,
      buyPremium,
      removeProduct,
      productId,
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
