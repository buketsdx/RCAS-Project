import { useSubscription, FEATURE_LIMITS } from '@/context/SubscriptionContext';

export const useFeatureAccess = (featureName) => {
  const { isPremium, hasAdAccess } = useSubscription();

  const limits = FEATURE_LIMITS[featureName] || {};

  const checkAccess = (actionType, currentCount = 0) => {
    // If Premium, everything is allowed
    if (isPremium) {
      return { allowed: true, reason: null };
    }

    // Check specific action limits
    if (actionType === 'create_entry') {
      const limit = limits.max_entries_per_month;
      if (limit !== undefined && currentCount >= limit) {
        // Check if unlocked via ad
        if (hasAdAccess(`${featureName}_create_entry`)) {
          return { allowed: true, reason: 'ad_unlocked' };
        }
        return { allowed: false, reason: 'limit_reached', limit };
      }
    }

    if (actionType === 'create_wallet') {
        const limit = limits.max_wallets;
        if (limit !== undefined && currentCount >= limit) {
          if (hasAdAccess(`${featureName}_create_wallet`)) {
            return { allowed: true, reason: 'ad_unlocked' };
          }
          return { allowed: false, reason: 'limit_reached', limit };
        }
    }

    if (actionType === 'compare_suppliers') {
        const limit = limits.max_suppliers;
        if (limit !== undefined && currentCount > limit) {
             if (hasAdAccess(`${featureName}_compare_suppliers`)) {
                return { allowed: true, reason: 'ad_unlocked' };
              }
            return { allowed: false, reason: 'limit_reached', limit };
        }
    }

    if (actionType === 'create_transaction') {
        const limit = limits.max_transactions_per_month;
        if (limit !== undefined && currentCount >= limit) {
             if (hasAdAccess(`${featureName}_create_transaction`)) {
                return { allowed: true, reason: 'ad_unlocked' };
              }
            return { allowed: false, reason: 'limit_reached', limit };
        }
    }

    if (actionType === 'export') {
      if (limits.allow_export === false) {
         if (hasAdAccess(`${featureName}_export`)) {
            return { allowed: true, reason: 'ad_unlocked' };
          }
        return { allowed: false, reason: 'premium_only' };
      }
    }

    return { allowed: true };
  };

  return {
    isPremium,
    limits,
    checkAccess
  };
};
