
import { createClient } from '@insforge/sdk';

let client = null;

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
  ZATCAInvoice: 'zatca_invoices'
};

const getTableName = (entityName) => {
  return tableMapping[entityName] || entityName;
};

// Helper to merge Auth User + Profile
const normalizeUser = async (authUser) => {
  if (!authUser) return null;
  
  // Fetch profile using the database client
  // Note: InsForge might expose database via client.database
  const db = client.database || client;
  
  const { data: profile } = await db
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

export const insforgeAdapter = {
  name: 'insforge',
  
  initialize: async (config) => {
    if (!config?.baseUrl || !config?.anonKey) {
      throw new Error("InsForge Base URL and Anon Key are required");
    }
    client = createClient({
      baseUrl: config.baseUrl,
      anonKey: config.anonKey
    });
    return Promise.resolve();
  },

  list: async (entityName, context) => {
    if (!client) throw new Error("InsForge client not initialized");
    const tableName = getTableName(entityName);
    const db = client.database || client;
    
    let query = db.from(tableName).select('*');
    
    // Filter by Company ID
    if (context?.companyId && !globalEntities.includes(entityName)) {
      query = query.eq('company_id', context.companyId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  create: async (entityName, data, context) => {
    if (!client) throw new Error("InsForge client not initialized");
    const tableName = getTableName(entityName);
    const db = client.database || client;

    const newRecord = { ...data };
    // Auto-inject Company ID
    if (context?.companyId && !newRecord.company_id && !globalEntities.includes(entityName)) {
      newRecord.company_id = context.companyId;
    }

    // Remove ID if it's auto-generated (unless UUID provided)
    if (!newRecord.id || typeof newRecord.id === 'number') delete newRecord.id; 

    const { data: result, error } = await db
      .from(tableName)
      .insert([newRecord]) // InsForge might require array for insert like Supabase
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  update: async (entityName, id, data) => {
    if (!client) throw new Error("InsForge client not initialized");
    const tableName = getTableName(entityName);
    const db = client.database || client;

    const { data: result, error } = await db
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  delete: async (entityName, id) => {
    if (!client) throw new Error("InsForge client not initialized");
    const tableName = getTableName(entityName);
    const db = client.database || client;

    const { error } = await db
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  // Raw query builder
  from: (tableName) => {
    if (!client) throw new Error("InsForge client not initialized");
    const db = client.database || client;
    return db.from(tableName);
  },

  // RPC
  rpc: async (fn, args) => {
    if (!client) throw new Error("InsForge client not initialized");
    const db = client.database || client;
    // Assume standard PostgREST rpc support
    if (db.rpc) {
      return await db.rpc(fn, args);
    }
    throw new Error("RPC not supported by this InsForge client version");
  },

  auth: {
    onAuthStateChange: (callback) => {
       if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
       return client.auth.onAuthStateChange(callback);
    },
    getSession: async () => {
      if (!client) return { data: { session: null } };
      return await client.auth.getSession();
    },
    login: async (username, password) => {
      if (!client) throw new Error("InsForge client not initialized");
      const { data, error } = await client.auth.signInWithPassword({
        email: username,
        password: password,
      });
      if (error) throw error;
      return await normalizeUser(data.user);
    },

    loginWithGoogle: async (data) => {
      if (!client) throw new Error("InsForge client not initialized");
      
      if (data.token) {
        const { data: result, error } = await client.auth.signInWithIdToken({
          provider: 'google',
          token: data.token,
        });
        if (error) throw error;
        return await normalizeUser(result.user);
      } 
      
      const { data: result, error } = await client.auth.signInWithOAuth({
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
      if (!client) throw new Error("InsForge client not initialized");
      const { data, error } = await client.auth.signUp({
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
      if (!client) return null;
      const { data: { user } } = await client.auth.getUser();
      return await normalizeUser(user);
    },

    logout: async () => {
      if (!client) return;
      await client.auth.signOut();
    },
    
    // Additional methods for user management if needed
    updateUser: async (attributes) => {
       if (!client) return;
       const { data, error } = await client.auth.updateUser(attributes);
       if (error) throw error;
       return data;
    }
  }
};
