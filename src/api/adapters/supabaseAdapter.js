
import { createClient } from '@supabase/supabase-js';
import { supabase as defaultSupabase } from '../../lib/supabase';

let supabase = null;

const globalEntities = ['User', 'Company', 'Currency', 'Settings'];

const tableMapping = {
  Company: 'companies',
  Branch: 'branches',
  Currency: 'currencies',
  AccountGroup: 'account_groups',
  Ledger: 'ledgers',
  StockGroup: 'stock_groups',
  StockItem: 'stock_items',
  Unit: 'units',
  Godown: 'godowns',
  CostCenter: 'cost_centers',
  VoucherType: 'voucher_types',
  Voucher: 'vouchers',
  VoucherItem: 'voucher_items',
  VoucherLedgerEntry: 'voucher_ledger_entries',
  Employee: 'employees',
  SalaryComponent: 'salary_components',
  Payroll: 'payroll',
  User: 'profiles', 
  Settings: 'settings',
  BranchDailyRecord: 'branch_daily_records',
  CustodyWallet: 'custody_wallets',
  CustodyTransaction: 'custody_transactions',
  FlowerWaste: 'flower_waste',
  BankReconciliation: 'bank_reconciliations',
  ZATCAInvoice: 'zatca_invoices',
  IDCounter: 'id_counters'
};

const getTableName = (entityName) => {
  return tableMapping[entityName] || entityName;
};

// Helper to merge Auth User + Profile
const normalizeUser = async (authUser) => {
  if (!authUser) return null;
  
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return {
    ...authUser,
    // Prefer profile data, fallback to metadata
    full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
    role: profile?.role || authUser.user_metadata?.role || 'User',
    allowed_companies: profile?.allowed_companies || [],
    // Include profile ID as top-level ID if needed (Auth user id is UUID)
    id: authUser.id 
  };
};

export const supabaseAdapter = {
  name: 'supabase',
  
  initialize: async (config) => {
    if (!config?.supabaseUrl || !config?.supabaseKey) {
      throw new Error("Supabase URL and Key are required");
    }
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    return Promise.resolve();
  },

  list: async (entityName, context) => {
    if (!supabase) throw new Error("Supabase not initialized");
    const tableName = getTableName(entityName);
    
    let query = supabase.from(tableName).select('*');
    
    // Filter by Company ID
    if (context?.companyId && !globalEntities.includes(entityName)) {
      query = query.eq('company_id', context.companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  get: async (entityName, id, context) => {
    if (!supabase) throw new Error("Supabase not initialized");
    const tableName = getTableName(entityName);

    let query = supabase.from(tableName).select('*').eq('id', id);
    if (context?.companyId && !globalEntities.includes(entityName)) {
      query = query.eq('company_id', context.companyId);
    }

    const { data, error } = await query.single();
    if (error) throw error;
    return data;
  },

  create: async (entityName, data, context) => {
    if (!supabase) throw new Error("Supabase not initialized");
    const tableName = getTableName(entityName);

    const newRecord = { ...data };
    // Auto-inject Company ID
    if (context?.companyId && !newRecord.company_id && !globalEntities.includes(entityName)) {
      newRecord.company_id = context.companyId;
    }

    // Remove ID if it's auto-generated (unless UUID provided)
    if (!newRecord.id || typeof newRecord.id === 'number') delete newRecord.id; 

    const { data: result, error } = await supabase
      .from(tableName)
      .insert(newRecord)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (entityName, id, data) => {
    if (!supabase) throw new Error("Supabase not initialized");
    const tableName = getTableName(entityName);

    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (entityName, id) => {
    if (!supabase) throw new Error("Supabase not initialized");
    const tableName = getTableName(entityName);

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  // Raw query builder
  from: (tableName) => {
    if (!supabase) throw new Error("Supabase not initialized");
    return supabase.from(tableName);
  },

  // RPC
  rpc: async (fn, args) => {
    if (!supabase) throw new Error("Supabase not initialized");
    return await supabase.rpc(fn, args);
  },

  auth: {
    onAuthStateChange: (callback) => {
       if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
       return supabase.auth.onAuthStateChange(callback);
    },
    getSession: async () => {
      if (!supabase) return { data: { session: null } };
      return await supabase.auth.getSession();
    },
    login: async (username, password) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });
      if (error) throw error;
      return await normalizeUser(data.user);
    },

    loginWithGoogle: async (data) => {
      if (!supabase) throw new Error("Supabase not initialized");
      
      if (data.token) {
        const { data: result, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: data.token,
        });
        if (error) throw error;
        return await normalizeUser(result.user);
      } 
      
      const { data: result, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
      return null;
    },
    
    register: async ({ email, password, full_name }) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      });
      if (error) throw error;
      // Profile trigger will handle profile creation
      return await normalizeUser(data.user);
    },

    me: async () => {
      if (!supabase) return null;
      const { data: { user } } = await supabase.auth.getUser();
      return await normalizeUser(user);
    },

    logout: async () => {
      if (!supabase) return;
      await supabase.auth.signOut();
    },

    requestPasswordReset: async (email) => {
      if (!supabase) throw new Error("Supabase not initialized");
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      return { success: true, message: "Password reset link sent to email" };
    }
  }
};
